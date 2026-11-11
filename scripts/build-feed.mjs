// Rebuilds feed.xml from the posts stored in Supabase, so RSS readers see the
// same posts as the site. Run with `node scripts/build-feed.mjs`; the
// "Build RSS feed" workflow runs it on a schedule and commits any change.
//
// The Supabase URL and public anon key are read from js/script.js so there is
// only one place to update them.
import { readFile, writeFile } from 'node:fs/promises';

const SITE_URL = 'https://aashish000000.github.io/Moodring/';
const MAX_ITEMS = 30;

const root = new URL('../', import.meta.url);
const siteScript = await readFile(new URL('js/script.js', root), 'utf8');
const supabaseUrl = siteScript.match(/SUPABASE_URL:\s*'([^']+)'/)?.[1];
const supabaseKey = siteScript.match(/SUPABASE_KEY:\s*'([^']+)'/)?.[1];
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Could not find SUPABASE_URL / SUPABASE_KEY in js/script.js');
}

const response = await fetch(
    `${supabaseUrl}/rest/v1/posts?select=id,text,timestamp&order=timestamp.desc&limit=${MAX_ITEMS}`,
    {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: AbortSignal.timeout(30_000),
    }
);
if (!response.ok) {
    throw new Error(`Supabase responded ${response.status}: ${await response.text()}`);
}
const posts = await response.json();
if (!Array.isArray(posts) || posts.length === 0) {
    // An empty answer most likely means a paused project, not a deleted blog.
    throw new Error('No posts returned; leaving feed.xml untouched.');
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text) {
    return text
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

// Posts are stored as editor HTML. Reduce one to plain paragraphs.
function toParagraphs(html) {
    const text = String(html ?? '')
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, '\n')
        .replace(/<(p|div|li|blockquote|h[1-6])[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '');
    return decodeEntities(text)
        .split('\n')
        .map(line => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
}

function escapeXml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function titleFor(paragraphs) {
    const first = paragraphs[0] ?? 'Untitled';
    if (first.length <= 80) return first;
    return first.slice(0, 77).replace(/\s+\S*$/, '') + '…';
}

const items = posts.map(post => {
    const paragraphs = toParagraphs(post.text);
    const link = `${SITE_URL}#${post.id}`;
    const body = paragraphs.map(p => `<p>${escapeXml(p)}</p>`).join('');
    return `        <item>
            <title>${escapeXml(titleFor(paragraphs))}</title>
            <link>${escapeXml(link)}</link>
            <guid isPermaLink="true">${escapeXml(link)}</guid>
            <pubDate>${new Date(Number(post.timestamp)).toUTCString()}</pubDate>
            <description>${escapeXml(body)}</description>
        </item>`;
});

// Dated by the newest post, not by "now", so an unchanged blog produces an
// identical file and the workflow has nothing to commit.
const lastBuild = new Date(Number(posts[0].timestamp)).toUTCString();

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Aashish Joshi - Personal Blog</title>
        <link>${SITE_URL}</link>
        <description>Thoughts, ideas &amp; creative musings by Aashish Joshi. A personal space for unfiltered thoughts.</description>
        <language>en-us</language>
        <lastBuildDate>${lastBuild}</lastBuildDate>
        <atom:link href="${SITE_URL}feed.xml" rel="self" type="application/rss+xml"/>
        <image>
            <url>${SITE_URL}assets/avatar.png</url>
            <title>Aashish Joshi - Personal Blog</title>
            <link>${SITE_URL}</link>
        </image>
${items.join('\n')}
    </channel>
</rss>
`;

await writeFile(new URL('feed.xml', root), feed);
console.log(`Wrote feed.xml with ${items.length} posts.`);
