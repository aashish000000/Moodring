// ═══════════════════════════════════════════════════════════════
// MOODRING - Personal Mood Blog by Aashish Joshi
// Admin-only posting, visitors can view and react
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const API_CONFIG = {
    OPENWEATHER_KEY: 'a5d032888107167a82e68c30ac1f4ad6',
    WEATHER_CITY: 'Kearny,NJ,US',
    SUPABASE_URL: 'https://yexoyqwswfamxtxqzoac.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleG95cXdzd2ZhbXh0eHF6b2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDQ4NTksImV4cCI6MjA4MDEyMDg1OX0.rx1E9v7vsjs45vs3pgXvY8bgLNeJHLCagL3yye0Bjag',
};

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const CONFIG = {
    STORAGE_KEY: 'moodring_posts',
    THEME_KEY: 'moodring_theme',
    STREAK_KEY: 'moodring_streak',
    DRAFT_KEY: 'moodring_draft',
    WORDS_PER_MINUTE: 200,
};

// ═══════════════════════════════════════════════════════════════
// FALLBACK DATA
// ═══════════════════════════════════════════════════════════════
const FALLBACK_QUOTES = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "What we think, we become.", author: "Buddha" },
    { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
];

const FALLBACK_PROMPTS = {
    blue: [
        "Write about a memory that still visits you on quiet nights.",
        "Describe a goodbye you never got to say.",
        "What would you tell your younger self about the pain they haven't felt yet?",
    ],
    yellow: [
        "Describe a small moment today that made you smile unexpectedly.",
        "Write about something you're grateful for that you usually overlook.",
        "What does your perfect morning look like?",
    ],
    red: [
        "What's something everyone accepts that you think is completely wrong?",
        "Write about a time you stayed silent when you should have spoken up.",
        "What would you say to someone if there were no consequences?",
    ]
};

const samplePosts = [
    {
        id: 'sample-1',
        text: "There's a peculiar comfort in rainy afternoons—when the world slows down and you can finally hear your own thoughts without the noise of expectation.",
        mood: "blue",
        date: "November 28, 2024",
        timestamp: new Date('2024-11-28').getTime(),
        isSample: true
    },
    {
        id: 'sample-2',
        text: "Found a coffee shop today where the barista remembered my order from three weeks ago. It's the small recognitions that make a city feel like home.",
        mood: "yellow",
        date: "November 27, 2024",
        timestamp: new Date('2024-11-27').getTime(),
        isSample: true
    },
    {
        id: 'sample-3',
        text: "Can we talk about how 'we need to talk' is the most anxiety-inducing phrase in any language? Just say what you mean. **Ambiguity is violence.**",
        mood: "red",
        date: "November 26, 2024",
        timestamp: new Date('2024-11-26').getTime(),
        isSample: true
    }
];

// ═══════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════
let supabaseClient = null;
let IS_ADMIN = false;
let currentUser = null;
let currentFilter = 'all';
let searchQuery = '';
let selectedMood = null;
let currentPostImages = [];
let currentPostAudio = null;

const moodLabels = { blue: 'Melancholy', yellow: 'Vibrant', red: 'Fiery' };
const moodEmojis = { blue: '🌊', yellow: '✨', red: '🔥' };

// ═══════════════════════════════════════════════════════════════
// SUPABASE INITIALIZATION
// ═══════════════════════════════════════════════════════════════
function initSupabase() {
    if (API_CONFIG.SUPABASE_URL && API_CONFIG.SUPABASE_KEY && window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(API_CONFIG.SUPABASE_URL, API_CONFIG.SUPABASE_KEY);
            updateSyncStatus('synced');
            return true;
        } catch (e) {
            console.error('Supabase init failed:', e);
        }
    }
    updateSyncStatus('local');
    return false;
}

function updateSyncStatus(status) {
    const syncEl = document.getElementById('syncStatus');
    if (!syncEl) return;
    const textEl = syncEl.querySelector('.sync-text');
    syncEl.classList.remove('synced', 'syncing');
    if (status === 'synced') {
        syncEl.classList.add('synced');
        if (textEl) textEl.textContent = 'Synced';
    } else if (status === 'syncing') {
        syncEl.classList.add('syncing');
        if (textEl) textEl.textContent = 'Syncing...';
    } else {
        if (textEl) textEl.textContent = 'Local';
    }
}

async function syncAllPostsToCloud() {
    if (!supabaseClient) {
        showToast('Not connected to cloud. Check internet.');
        console.error('Supabase client not initialized');
        return;
    }
    
    const localPosts = getLocalPosts().filter(p => !p.isSample);
    console.log('Local posts to sync:', localPosts.length);
    
    if (localPosts.length === 0) {
        showToast('No local posts to sync');
        return;
    }
    
    showToast('Syncing posts to cloud...');
    updateSyncStatus('syncing');
    
    let synced = 0;
    let failed = 0;
    let lastError = null;
    
    for (const post of localPosts) {
        try {
            // Prepare post data
            const postData = {
                id: post.id,
                text: post.text,
                mood: post.mood,
                date: post.date,
                timestamp: post.timestamp,
                images: null,
                image: null,
                audio: null
            };
            
            // Compress images for cloud sync (max 100KB each)
            if (post.images && post.images.length > 0) {
                const compressedImages = [];
                for (const img of post.images) {
                    if (img && img.startsWith('data:')) {
                        const compressed = await recompressForSync(img);
                        if (compressed) compressedImages.push(compressed);
                    }
                }
                if (compressedImages.length > 0) {
                    postData.images = compressedImages;
                    postData.image = compressedImages[0];
                }
            } else if (post.image && post.image.startsWith('data:')) {
                const compressed = await recompressForSync(post.image);
                if (compressed) {
                    postData.image = compressed;
                    postData.images = [compressed];
                }
            }
            
            console.log('Syncing post:', post.id);
            
            // Use upsert to handle both insert and update
            const { error } = await supabaseClient
                .from('posts')
                .upsert(postData, { onConflict: 'id' });
            
            if (error) {
                console.error('Sync error for post:', post.id, error.message, error);
                lastError = error.message;
                failed++;
            } else {
                console.log('Post synced:', post.id);
                synced++;
            }
        } catch (e) {
            console.error('Sync exception for post:', post.id, e);
            lastError = e.message;
            failed++;
        }
    }
    
    updateSyncStatus(synced > 0 ? 'synced' : 'local');
    
    if (synced > 0 && failed === 0) {
        showToast(`${synced} post${synced > 1 ? 's' : ''} synced!`);
    } else if (synced > 0 && failed > 0) {
        showToast(`${synced} synced, ${failed} failed`);
    } else if (failed > 0) {
        showToast(`Sync failed: ${lastError || 'Unknown error'}`);
    } else {
        showToast('All posts already synced');
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION - Admin Only
// ═══════════════════════════════════════════════════════════════
async function checkAuth() {
    if (!supabaseClient) return null;
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            currentUser = user;
            IS_ADMIN = true;
            updateAdminUI(true);
            return user;
        }
    } catch (e) {
        console.log('Auth check failed:', e);
    }
    updateAdminUI(false);
    return null;
}

async function login(email, password) {
    console.log('Login function called, supabaseClient:', !!supabaseClient);
    if (!supabaseClient) throw new Error('Database not connected. Please check Supabase configuration.');

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    console.log('Supabase auth response:', { data, error });
    if (error) throw error;

    currentUser = data.user;
    IS_ADMIN = true;
    updateAdminUI(true);
    return data;
}

async function logout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    currentUser = null;
    IS_ADMIN = false;
    updateAdminUI(false);
    window.location.reload();
}

function updateAdminUI(isAdmin) {
    const adminElements = document.querySelectorAll('.admin-only');
    const visitorElements = document.querySelectorAll('.visitor-only');
    const loginBtn = document.getElementById('loginBtn');
    const adminBadge = document.getElementById('adminBadge');
    
    adminElements.forEach(el => el.style.display = isAdmin ? '' : 'none');
    visitorElements.forEach(el => el.style.display = isAdmin ? 'none' : '');
    
    if (loginBtn) {
        loginBtn.querySelector('span').textContent = isAdmin ? 'Logout' : 'Login';
    }
    if (adminBadge) {
        adminBadge.style.display = isAdmin ? 'inline-flex' : 'none';
    }
}

// ═══════════════════════════════════════════════════════════════
// POSTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════
function getLocalPosts() {
    try {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

function saveLocalPosts(posts) {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
            console.error('Storage quota exceeded, clearing old posts...');
            // Keep only the 10 most recent posts
            const trimmedPosts = posts.slice(0, 10);
            // Remove images from older posts to save space
            const lighterPosts = trimmedPosts.map((p, i) => {
                if (i > 5) {
                    return { ...p, images: null, image: null, audio: null };
                }
                return p;
            });
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(lighterPosts));
                showToast('Storage full - some old images removed');
            } catch (e2) {
                // Last resort: clear everything except the newest post
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify([posts[0]]));
                showToast('Storage full - only newest post kept');
            }
        } else {
            throw e;
        }
    }
}

async function getAllPosts() {
    let supabasePosts = [];
    
    // Try Supabase
    if (supabaseClient) {
        try {
            console.log('Fetching posts from Supabase...');
            const { data, error } = await supabaseClient
                .from('posts')
                .select('*')
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('Supabase fetch error:', error);
            } else if (data) {
                console.log('Supabase posts found:', data.length);
                supabasePosts = data;
            }
        } catch (e) {
            console.error('Supabase fetch failed:', e);
        }
    } else {
        console.log('Supabase client not initialized');
    }

    // Get local posts
    const localPosts = getLocalPosts();
    
    // Merge: local posts + supabase posts (avoiding duplicates by ID)
    const supabaseIds = new Set(supabasePosts.map(p => p.id));
    const uniqueLocalPosts = localPosts.filter(p => !supabaseIds.has(p.id));
    
    // Combine all: local (not in supabase) + supabase + samples
    const allPosts = [...uniqueLocalPosts, ...supabasePosts, ...samplePosts];
    
    // Remove duplicate sample posts if they exist in supabase
    const seenIds = new Set();
    const dedupedPosts = allPosts.filter(p => {
        if (seenIds.has(p.id)) return false;
        seenIds.add(p.id);
        return true;
    });
    
    return dedupedPosts.sort((a, b) => b.timestamp - a.timestamp);
}

async function createPost(text, mood, images = [], audio = null) {
    const now = new Date();
    const newPost = {
        id: 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        text: text.trim(),
        mood,
        date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        timestamp: now.getTime(),
        images: images.length > 0 ? images : null,
        image: images.length === 1 ? images[0] : null,
        audio,
    };
    
    console.log('Creating new post:', newPost.id);
    
    // Save locally first (always works)
    const localPosts = getLocalPosts();
    localPosts.unshift({ ...newPost, isSample: false });
    saveLocalPosts(localPosts);
    console.log('Post saved locally. Total local posts:', localPosts.length);
    
    // Try to sync to Supabase
    if (supabaseClient) {
        updateSyncStatus('syncing');
        try {
            // Compress images for cloud
            const cloudPost = { ...newPost };
            if (cloudPost.images && cloudPost.images.length > 0) {
                const compressedImages = [];
                for (const img of cloudPost.images) {
                    if (img && img.startsWith('data:')) {
                        const compressed = await recompressForSync(img);
                        if (compressed) compressedImages.push(compressed);
                    }
                }
                cloudPost.images = compressedImages.length > 0 ? compressedImages : null;
                cloudPost.image = compressedImages[0] || null;
            }
            
            const { error } = await supabaseClient.from('posts').insert(cloudPost);
            if (error) {
                console.log('Supabase insert error:', error);
                updateSyncStatus('local');
            } else {
                console.log('Post synced to Supabase');
                updateSyncStatus('synced');
            }
        } catch (e) {
            console.log('Supabase sync failed:', e);
            updateSyncStatus('local');
        }
    }
    
    updateStreak();
    return newPost;
}

async function deletePost(postId) {
    // Security check - only admin can delete
    if (!IS_ADMIN || !currentUser) {
        console.log('Unauthorized delete attempt');
        return false;
    }
    
    // Remove locally
    const localPosts = getLocalPosts();
    const filtered = localPosts.filter(p => p.id !== postId);
    saveLocalPosts(filtered);
    
    // Remove from Supabase
    if (supabaseClient) {
        updateSyncStatus('syncing');
        try {
            await supabaseClient.from('posts').delete().eq('id', postId);
            updateSyncStatus('synced');
        } catch (e) {
            updateSyncStatus('local');
        }
    }
    
    return true;
}

// ═══════════════════════════════════════════════════════════════
// REACTIONS (for visitors)
// ═══════════════════════════════════════════════════════════════
function getSessionId() {
    let sessionId = sessionStorage.getItem('moodring_session');
    if (!sessionId) {
        sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('moodring_session', sessionId);
    }
    return sessionId;
}

async function getReactions(postId) {
    if (!supabaseClient) return {};
    
    try {
        const { data } = await supabaseClient
            .from('reactions')
            .select('reaction_type')
            .eq('post_id', postId);
        
        const counts = { '❤️': 0, '👍': 0, '😂': 0, '🔥': 0, '💭': 0 };
        data?.forEach(r => {
            if (counts[r.reaction_type] !== undefined) {
                counts[r.reaction_type]++;
            }
        });
        return counts;
    } catch (e) {
        return {};
    }
}

async function toggleReaction(postId, reactionType) {
    if (!supabaseClient) return null;
    
    const sessionId = getSessionId();
    
    try {
        const { data: existing } = await supabaseClient
            .from('reactions')
            .select('id')
            .eq('post_id', postId)
            .eq('reaction_type', reactionType)
            .eq('session_id', sessionId)
            .single();
        
        if (existing) {
            await supabaseClient.from('reactions').delete().eq('id', existing.id);
            return false;
        } else {
            await supabaseClient.from('reactions').insert({
                post_id: postId,
                reaction_type: reactionType,
                session_id: sessionId
            });
            return true;
        }
    } catch (e) {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// VISITOR COUNTER
// ═══════════════════════════════════════════════════════════════
async function trackVisitor() {
    if (sessionStorage.getItem('visited') || !supabaseClient) return;
    sessionStorage.setItem('visited', 'true');
    
    try {
        const { data } = await supabaseClient
            .from('visitors')
            .select('count')
            .eq('id', 1)
            .single();
        
        if (data) {
            await supabaseClient
                .from('visitors')
                .update({ count: data.count + 1 })
                .eq('id', 1);
        }
    } catch (e) {}
    
    fetchVisitorCount();
}

async function fetchVisitorCount() {
    if (!supabaseClient) return;
    
    try {
        const { data } = await supabaseClient
            .from('visitors')
            .select('count')
            .eq('id', 1)
            .single();
        
        if (data) {
            const el = document.getElementById('visitorCount');
            if (el) el.textContent = data.count.toLocaleString();
        }
    } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════
async function renderPosts() {
    const postsList = document.getElementById('postsList');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!postsList) return;
    
    postsList.innerHTML = '<div class="loading-posts">Loading...</div>';
    
    let posts = await getAllPosts();
    
    // Filter by mood
    if (currentFilter !== 'all') {
        posts = posts.filter(p => p.mood === currentFilter);
    }
    
    // Search
    if (searchQuery) {
        posts = posts.filter(p => 
            p.text.toLowerCase().includes(searchQuery) ||
            p.date.toLowerCase().includes(searchQuery)
        );
    }
    
    if (resultsCount) {
        resultsCount.textContent = searchQuery ? `${posts.length} result${posts.length !== 1 ? 's' : ''}` : '';
    }
    
    if (posts.length === 0) {
        postsList.innerHTML = `
            <div class="empty-state">
                <p>${searchQuery ? 'No posts match your search.' : 'No posts yet.'}</p>
            </div>
        `;
        return;
    }
    
    postsList.innerHTML = posts.map(post => renderPostCard(post)).join('');

    // Load reactions
    for (const post of posts) {
        await updateReactionsSummary(post.id);
    }
}

async function updateReactionsSummary(postId) {
    const reactions = await getReactions(postId);
    const summaryEl = document.getElementById(`reactions-summary-${postId}`);
    
    if (!summaryEl) return;
    
    const totalCount = Object.values(reactions).reduce((a, b) => a + b, 0);
    const activeReactions = Object.entries(reactions)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);
    
    if (totalCount === 0) {
        summaryEl.innerHTML = '';
        return;
    }
    
    const topEmojis = activeReactions.slice(0, 3).map(([emoji]) => emoji).join('');
    
    summaryEl.innerHTML = `
        <span class="reaction-emojis">${topEmojis}</span>
        <span class="reaction-total">${totalCount}</span>
    `;
}

async function highlightCurrentReaction(postId) {
    if (!supabaseClient) return;
    
    const sessionId = getSessionId();
    const popup = document.querySelector(`.reactions-popup[data-post-id="${postId}"]`);
    if (!popup) return;
    
    // Clear previous highlights
    popup.querySelectorAll('.reaction-emoji').forEach(btn => {
        btn.classList.remove('user-reacted');
    });
    
    try {
        // Check all reaction types
        for (const emoji of ['❤️', '👍', '😂', '🔥', '💭']) {
            const { data } = await supabaseClient
                .from('reactions')
                .select('id')
                .eq('post_id', postId)
                .eq('reaction_type', emoji)
                .eq('session_id', sessionId)
                .single();
            
            if (data) {
                const btn = popup.querySelector(`.reaction-emoji[data-reaction="${emoji}"]`);
                if (btn) btn.classList.add('user-reacted');
            }
        }
    } catch (e) {}
}

function renderPostGallery(post) {
    const images = post.images || (post.image ? [post.image] : []);
    if (images.length === 0) return '';
    
    const count = images.length;
    const gridClass = `post-gallery gallery-${Math.min(count, 4)}`;
    
    return `
        <div class="${gridClass}">
            ${images.slice(0, 4).map((src, i) => `
                <div class="gallery-item" onclick="openImageViewer('${src}')">
                    <img src="${src}" alt="Photo ${i + 1}" loading="lazy">
                    ${count > 4 && i === 3 ? `<div class="gallery-more">+${count - 4}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function openImageViewer(src) {
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer';
    viewer.innerHTML = `
        <div class="image-viewer-backdrop" onclick="this.parentElement.remove()"></div>
        <img src="${src}" alt="Full size image">
        <button class="image-viewer-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(viewer);
}

window.openImageViewer = openImageViewer;

function renderPostCard(post) {
    const isOwner = IS_ADMIN && !post.isSample;
    
    return `
        <article class="post-card ${post.mood}" data-id="${post.id}">
            <div class="post-meta">
                <span class="post-mood ${post.mood}">${moodEmojis[post.mood]} ${moodLabels[post.mood]}</span>
                <span class="post-date">${post.date}</span>
                <span class="post-reading-time">${calculateReadingTime(post.text)}</span>
                ${isOwner ? `
                    <div class="post-actions admin-only">
                        <button class="delete-btn" onclick="handleDelete('${post.id}')" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>
            
            <div class="post-content">${parseMarkdown(post.text)}</div>
            
            ${renderPostGallery(post)}
            ${post.audio ? `<div class="post-audio"><audio controls src="${post.audio}"></audio></div>` : ''}
            
            <div class="post-footer">
                <div class="reactions-wrapper">
                    <div class="reaction-trigger" data-post-id="${post.id}">
                        <button class="like-btn" data-post-id="${post.id}">
                            <span class="like-icon">🤍</span>
                            <span class="like-text">React</span>
                        </button>
                        <div class="reactions-popup" data-post-id="${post.id}">
                            ${['❤️', '👍', '😂', '🔥', '💭'].map((emoji, i) => `
                                <button class="reaction-emoji" data-post-id="${post.id}" data-reaction="${emoji}" style="--delay: ${i * 0.05}s">
                                    <span class="emoji">${emoji}</span>
                                    <span class="emoji-label">${['Love', 'Like', 'Haha', 'Fire', 'Think'][i]}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="reactions-summary" id="reactions-summary-${post.id}"></div>
                </div>
                <div class="share-actions">
                    <button class="share-btn" onclick="toggleShareMenu('${post.id}')" title="Share">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                    <div class="share-menu" id="share-menu-${post.id}">
                        <button onclick="shareToTwitter(\`${escapeForAttr(post.text)}\`)">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            X / Twitter
                        </button>
                        <button onclick="shareToFacebook(\`${escapeForAttr(post.text)}\`)">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            Facebook
                        </button>
                        <button onclick="shareToLinkedIn(\`${escapeForAttr(post.text)}\`)">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            LinkedIn
                        </button>
                        <button onclick="shareToWhatsApp(\`${escapeForAttr(post.text)}\`)">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            WhatsApp
                        </button>
                        <button onclick="shareToTelegram(\`${escapeForAttr(post.text)}\`)">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                            Telegram
                        </button>
                        <button onclick="shareViaEmail(\`${escapeForAttr(post.text)}\`)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            Email
                        </button>
                        <button onclick="copyToClipboard(\`${escapeForAttr(post.text)}\`)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Copy text
                        </button>
                        <button onclick="shareAsImage('${post.id}')" class="share-image-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            Share as Image (Instagram)
                        </button>
                        <button onclick="nativeShare(\`${escapeForAttr(post.text)}\`)" class="native-share-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                            More options...
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

async function updateCounts() {
    const posts = await getAllPosts();
    
    document.getElementById('countAll').textContent = posts.length;
    document.getElementById('countBlue').textContent = posts.filter(p => p.mood === 'blue').length;
    document.getElementById('countYellow').textContent = posts.filter(p => p.mood === 'yellow').length;
    document.getElementById('countRed').textContent = posts.filter(p => p.mood === 'red').length;
}

// ═══════════════════════════════════════════════════════════════
// STREAK TRACKER
// ═══════════════════════════════════════════════════════════════
function getStreakData() {
    try {
        return JSON.parse(localStorage.getItem(CONFIG.STREAK_KEY) || '{"count":0,"lastDate":null}');
    } catch (e) {
        return { count: 0, lastDate: null };
    }
}

function updateStreak() {
    const streak = getStreakData();
    const today = new Date().toDateString();
    const lastDate = streak.lastDate ? new Date(streak.lastDate).toDateString() : null;
    
    if (lastDate === today) return streak;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastDate === yesterday.toDateString()) {
        streak.count += 1;
    } else {
        streak.count = 1;
    }
    
    streak.lastDate = new Date().toISOString();
    localStorage.setItem(CONFIG.STREAK_KEY, JSON.stringify(streak));
    displayStreak();
    return streak;
}

function displayStreak() {
    const streak = getStreakData();
    const banner = document.getElementById('streakBanner');
    const text = document.getElementById('streakText');
    
    if (banner && streak.count >= 2) {
        banner.style.display = 'flex';
        if (text) text.textContent = `${streak.count} day streak`;
    } else if (banner) {
        banner.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeForAttr(text) {
    return text.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/"/g, '\\"');
}

function parseMarkdown(text) {
    if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true });
        return marked.parse(text);
    }
    return escapeHtml(text).replace(/\n/g, '<br>');
}

function calculateReadingTime(text) {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / CONFIG.WORDS_PER_MINUTE);
    return minutes < 1 ? '< 1 min read' : `${minutes} min read`;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2500);
}

// ═══════════════════════════════════════════════════════════════
// MODAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════
function openModal(preselectedMood = null) {
    if (!IS_ADMIN) {
        showToast('Only Aashish can write posts');
        return;
    }
    
    const modalOverlay = document.getElementById('modalOverlay');
    const thoughtInput = document.getElementById('thoughtInput');
    const charCount = document.getElementById('charCount');
    const moodOptions = document.querySelectorAll('.mood-option');
    
    if (thoughtInput) thoughtInput.value = '';
    if (charCount) charCount.textContent = '0';
    
    moodOptions.forEach(o => o.classList.remove('selected'));
    selectedMood = null;
    currentPostImages = [];
    currentPostAudio = null;
    removeImage();
    removeAudio();
    
    if (preselectedMood) {
        const moodBtn = document.querySelector(`.mood-option.${preselectedMood}`);
        if (moodBtn) {
            moodBtn.classList.add('selected');
            selectedMood = preselectedMood;
            fetchAIPrompt(preselectedMood);
        }
    }
    
    validateForm();
    if (modalOverlay) modalOverlay.classList.add('visible');
    if (thoughtInput) setTimeout(() => thoughtInput.focus(), 250);
}

function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) modalOverlay.classList.remove('visible');
}

function validateForm() {
    const thoughtInput = document.getElementById('thoughtInput');
    const submitBtn = document.getElementById('submitBtn');
    
    const hasText = thoughtInput && thoughtInput.value.trim().length > 0;
    const hasMood = selectedMood !== null;
    
    if (submitBtn) {
        submitBtn.disabled = !(hasText && hasMood);
        
        // Update button text to show what's missing
        if (!hasText && !hasMood) {
            submitBtn.textContent = 'Write & select mood';
        } else if (!hasText) {
            submitBtn.textContent = 'Write something';
        } else if (!hasMood) {
            submitBtn.textContent = 'Select a mood';
        } else {
            submitBtn.textContent = 'Publish';
        }
    }
}

function showLoginModal() {
    console.log('Opening login modal...');
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('visible');
        console.log('Login modal opened');
    } else {
        console.error('Login modal not found!');
    }
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('visible');
}

// ═══════════════════════════════════════════════════════════════
// IMAGE UPLOAD (Multiple) with Compression
// ═══════════════════════════════════════════════════════════════
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Resize if too large
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG
                const compressed = canvas.toDataURL('image/jpeg', quality);
                console.log(`Image compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`);
                resolve(compressed);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function recompressForSync(dataUrl, maxWidth = 400, quality = 0.5) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Resize smaller for cloud sync
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with lower quality for sync
            const compressed = canvas.toDataURL('image/jpeg', quality);
            console.log(`Recompressed for sync: ${(dataUrl.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`);
            resolve(compressed);
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
    });
}

function handleImageUpload(files) {
    if (!files || files.length === 0) {
        showToast('Please select images');
        return;
    }

    const maxImages = 4;
    const remainingSlots = maxImages - currentPostImages.length;

    if (remainingSlots <= 0) {
        showToast('Maximum 4 images allowed');
        return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    let processed = 0;

    filesToProcess.forEach(async file => {
        if (!file.type.startsWith('image/')) {
            showToast('Please select only images');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('Each image must be under 10MB');
            return;
        }

        try {
            const compressed = await compressImage(file);
            currentPostImages.push(compressed);
            processed++;
            if (processed === filesToProcess.length) {
                showImagePreview();
                showToast(`${processed} image${processed > 1 ? 's' : ''} added`);
            }
        } catch (err) {
            console.error('Image compression failed:', err);
            showToast('Failed to process image');
        }
    });
}

function showImagePreview() {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    
    if (currentPostImages.length === 0) {
        preview.innerHTML = '';
        preview.style.display = 'none';
        return;
    }
    
    const gridClass = `image-grid-${Math.min(currentPostImages.length, 4)}`;
    
    preview.innerHTML = `
        <div class="image-preview-grid ${gridClass}">
            ${currentPostImages.map((src, index) => `
                <div class="preview-image-item">
                    <img src="${src}" alt="Preview ${index + 1}">
                    <button type="button" class="remove-single-image" onclick="removeImage(${index})">×</button>
                </div>
            `).join('')}
        </div>
        ${currentPostImages.length < 4 ? `<p class="image-count">${currentPostImages.length}/4 images</p>` : ''}
    `;
    preview.style.display = 'block';
}

function removeImage(index) {
    if (typeof index === 'number') {
        currentPostImages.splice(index, 1);
        showImagePreview();
        showToast('Image removed');
    } else {
        currentPostImages = [];
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
    }
    const input = document.getElementById('imageInput');
    if (input) input.value = '';
}

// ═══════════════════════════════════════════════════════════════
// VOICE RECORDING
// ═══════════════════════════════════════════════════════════════
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingTimer = null;
let recordingSeconds = 0;

async function toggleAudioRecording() {
    if (isRecording) {
        stopAudioRecording();
    } else {
        startAudioRecording();
    }
}

async function startAudioRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = (e) => {
                currentPostAudio = e.target.result;
                showAudioPreview(currentPostAudio);
            };
            reader.readAsDataURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        recordingSeconds = 0;
        
        const btn = document.getElementById('recordBtn');
        if (btn) btn.classList.add('recording');
        
        recordingTimer = setInterval(() => {
            recordingSeconds++;
            showToast(`Recording... ${recordingSeconds}s`);
            if (recordingSeconds >= 60) stopAudioRecording();
        }, 1000);
        
        showToast('Recording started...');
    } catch (err) {
        showToast('Could not access microphone');
    }
}

function stopAudioRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        clearInterval(recordingTimer);
        
        const btn = document.getElementById('recordBtn');
        if (btn) btn.classList.remove('recording');
        
        showToast(`Voice clip saved (${recordingSeconds}s)`);
    }
}

function showAudioPreview(src) {
    const preview = document.getElementById('audioPreview');
    if (preview) {
        preview.innerHTML = `
            <div class="audio-preview-content">
                <span class="audio-label">🎤 Voice Clip</span>
                <audio controls src="${src}"></audio>
                <button type="button" class="remove-audio" onclick="removeAudio()">×</button>
            </div>
        `;
        preview.style.display = 'block';
    }
}

function removeAudio() {
    currentPostAudio = null;
    const preview = document.getElementById('audioPreview');
    if (preview) {
        preview.innerHTML = '';
        preview.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════
// VOICE TO TEXT
// ═══════════════════════════════════════════════════════════════
let recognition = null;
let isListening = false;

function toggleVoice() {
    if (window.location.protocol === 'file:') {
        showToast('Voice requires a server (use Live Server)');
        return;
    }
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice not supported - use Chrome or Edge');
        return;
    }
    
    if (isListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        
        const thoughtInput = document.getElementById('thoughtInput');
        if (thoughtInput && transcript) {
            const cursorPos = thoughtInput.selectionStart;
            const text = thoughtInput.value;
            thoughtInput.value = text.substring(0, cursorPos) + transcript + text.substring(cursorPos);
            thoughtInput.dispatchEvent(new Event('input'));
        }
    };
    
    recognition.onerror = () => {
        stopVoiceRecognition();
        showToast('Voice recognition error');
    };
    
    recognition.start();
    isListening = true;
    const btn = document.getElementById('voiceBtn');
    if (btn) btn.classList.add('listening');
    showToast('Listening...');
}

function stopVoiceRecognition() {
    if (recognition) recognition.stop();
    isListening = false;
    const btn = document.getElementById('voiceBtn');
    if (btn) btn.classList.remove('listening');
}

// ═══════════════════════════════════════════════════════════════
// DRAFT AUTO-SAVE
// ═══════════════════════════════════════════════════════════════
function saveDraft() {
    const thoughtInput = document.getElementById('thoughtInput');
    if (!thoughtInput) return;
    
    const draft = {
        text: thoughtInput.value,
        mood: selectedMood,
        images: currentPostImages,
        savedAt: new Date().toISOString()
    };
    localStorage.setItem(CONFIG.DRAFT_KEY, JSON.stringify(draft));
    showToast('Draft saved');
}

function restoreDraft() {
    const saved = localStorage.getItem(CONFIG.DRAFT_KEY);
    if (!saved) return;
    
    try {
        const draft = JSON.parse(saved);
        const thoughtInput = document.getElementById('thoughtInput');
        const charCount = document.getElementById('charCount');
        
        if (thoughtInput && draft.text) {
            thoughtInput.value = draft.text;
            if (charCount) charCount.textContent = draft.text.length;
        }
        
        if (draft.mood) {
            const moodBtn = document.querySelector(`.mood-option.${draft.mood}`);
            if (moodBtn) {
                document.querySelectorAll('.mood-option').forEach(o => o.classList.remove('selected'));
                moodBtn.classList.add('selected');
                selectedMood = draft.mood;
            }
        }
        
        if (draft.images && draft.images.length > 0) {
            currentPostImages = draft.images;
            showImagePreview();
        } else if (draft.image) {
            currentPostImages = [draft.image];
            showImagePreview();
        }
        
        validateForm();
        showToast('Draft restored');
    } catch (e) {}
}

function clearDraft() {
    localStorage.removeItem(CONFIG.DRAFT_KEY);
}

// ═══════════════════════════════════════════════════════════════
// AI WRITING PROMPTS
// ═══════════════════════════════════════════════════════════════
function fetchAIPrompt(mood) {
    const promptText = document.getElementById('aiPromptText');
    if (!promptText) return;
    
    const prompts = FALLBACK_PROMPTS[mood] || FALLBACK_PROMPTS.yellow;
    promptText.textContent = prompts[Math.floor(Math.random() * prompts.length)];
}

// ═══════════════════════════════════════════════════════════════
// SHARE FUNCTIONS
// ═══════════════════════════════════════════════════════════════
function toggleShareMenu(postId) {
    const menu = document.getElementById(`share-menu-${postId}`);
    const isOpening = menu && !menu.classList.contains('visible');
    
    // Close all other menus
    document.querySelectorAll('.share-menu').forEach(m => {
        if (m.id !== `share-menu-${postId}`) m.classList.remove('visible');
    });
    
    if (menu) {
        menu.classList.toggle('visible');
        
        // On mobile, prevent body scroll when menu is open
        if (window.innerWidth <= 600 && isOpening) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

function closeAllShareMenus() {
    document.querySelectorAll('.share-menu').forEach(m => m.classList.remove('visible'));
    document.body.style.overflow = '';
}

function shareToTwitter(text) {
    const truncated = text.length > 250 ? text.substring(0, 247) + '...' : text;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(truncated + '\n\n— Aashish Joshi')}&url=${encodeURIComponent(url)}`, '_blank');
    closeAllShareMenus();
}

async function shareAsImage(postId) {
    closeAllShareMenus();
    showToast('Creating image...');
    
    const postCard = document.querySelector(`.post-card[data-id="${postId}"]`);
    if (!postCard) {
        showToast('Post not found');
        return;
    }
    
    // Get post data
    const textEl = postCard.querySelector('.post-content');
    const moodEl = postCard.querySelector('.post-mood');
    const dateEl = postCard.querySelector('.post-date');
    
    const text = textEl?.innerText || '';
    const mood = postCard.classList.contains('blue') ? 'blue' : 
                 postCard.classList.contains('yellow') ? 'yellow' : 'red';
    const date = dateEl?.innerText || '';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Size for Instagram Story (1080x1920) or square (1080x1080)
    const width = 1080;
    const textLines = wrapText(ctx, text, width - 160, 42);
    const height = Math.max(1080, Math.min(1920, 400 + textLines.length * 60));
    
    canvas.width = width;
    canvas.height = height;
    
    // Background gradient based on mood
    const gradients = {
        blue: ['#1a1a2e', '#16213e', '#0f3460'],
        yellow: ['#1a1a0a', '#2d2d0a', '#3d3d0a'],
        red: ['#1a0a0a', '#2d0a0a', '#3d1a1a']
    };
    const colors = gradients[mood] || gradients.blue;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Mood emoji and accent
    const moodEmojis = { blue: '🌊', yellow: '✨', red: '🔥' };
    const moodColors = { blue: '#60a5fa', yellow: '#fbbf24', red: '#f87171' };
    
    // Draw mood indicator
    ctx.font = '80px Arial';
    ctx.fillText(moodEmojis[mood], 80, 120);
    
    // Draw accent line
    ctx.fillStyle = moodColors[mood];
    ctx.fillRect(80, 160, 100, 4);
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = '42px Georgia, serif';
    
    let y = 240;
    for (const line of textLines) {
        ctx.fillText(line, 80, y);
        y += 60;
    }
    
    // Draw footer
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '28px Arial';
    ctx.fillText('— Aashish Joshi', 80, height - 120);
    ctx.fillText(date, 80, height - 80);
    
    // Draw branding
    ctx.fillStyle = moodColors[mood];
    ctx.font = 'bold 24px Arial';
    ctx.fillText('MoodRing', width - 180, height - 80);
    
    // Convert to image and download/share
    canvas.toBlob(async (blob) => {
        const file = new File([blob], 'moodring-post.png', { type: 'image/png' });
        
        // Try native share first (works on mobile)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'MoodRing Post',
                    text: text.substring(0, 100)
                });
                showToast('Shared!');
                return;
            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.log('Native share failed:', e);
                }
            }
        }
        
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'moodring-post.png';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Image saved! Share it on Instagram');
    }, 'image/png');
}

function wrapText(ctx, text, maxWidth, fontSize) {
    ctx.font = `${fontSize}px Georgia, serif`;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines;
}

function shareToFacebook(text) {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
    closeAllShareMenus();
}

function shareToLinkedIn(text) {
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    closeAllShareMenus();
}

function shareToWhatsApp(text) {
    const truncated = text.length > 500 ? text.substring(0, 497) + '...' : text;
    const url = window.location.href;
    const message = `${truncated}\n\n— Aashish Joshi\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    closeAllShareMenus();
}

function shareToTelegram(text) {
    const truncated = text.length > 500 ? text.substring(0, 497) + '...' : text;
    const url = window.location.href;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(truncated + '\n\n— Aashish Joshi')}`, '_blank');
    closeAllShareMenus();
}

function shareViaEmail(text) {
    const subject = 'Check out this thought from Aashish Joshi';
    const body = `${text}\n\n— Aashish Joshi\n\nRead more: ${window.location.href}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    closeAllShareMenus();
}

function nativeShare(text) {
    if (navigator.share) {
        navigator.share({
            title: 'Aashish Joshi — Thoughts',
            text: text,
            url: window.location.href
        }).catch(() => {});
    } else {
        copyToClipboard(text);
    }
    closeAllShareMenus();
}

function copyToClipboard(text) {
    const fullText = `${text}\n\n— Aashish Joshi\n${window.location.href}`;
    navigator.clipboard.writeText(fullText).then(() => showToast('Copied to clipboard'));
    closeAllShareMenus();
}

// ═══════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════
function handleSearch(query) {
    searchQuery = query.toLowerCase().trim();
    document.getElementById('searchClear').style.display = query ? 'block' : 'none';
    renderPosts();
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    const clear = document.getElementById('searchClear');
    if (input) input.value = '';
    if (clear) clear.style.display = 'none';
    searchQuery = '';
    renderPosts();
}

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════
function initTheme() {
    const saved = localStorage.getItem(CONFIG.THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(CONFIG.THEME_KEY, newTheme);
}

// ═══════════════════════════════════════════════════════════════
// QUOTES
// ═══════════════════════════════════════════════════════════════
function fetchQuote() {
    const quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    const quoteText = document.getElementById('quoteText');
    const quoteAuthor = document.getElementById('quoteAuthor');
    
    if (quoteText) quoteText.textContent = `"${quote.text}"`;
    if (quoteAuthor) quoteAuthor.textContent = `— ${quote.author}`;
}

// ═══════════════════════════════════════════════════════════════
// WEATHER
// ═══════════════════════════════════════════════════════════════
const weatherMoodMap = {
    'Rain': { mood: 'blue', suggestion: "Rainy day... perfect for melancholic thoughts?" },
    'Drizzle': { mood: 'blue', suggestion: "Light drizzle outside... feeling reflective?" },
    'Thunderstorm': { mood: 'red', suggestion: "Storm brewing... channel that energy!" },
    'Snow': { mood: 'blue', suggestion: "Snow falling... a quiet, contemplative mood?" },
    'Clear': { mood: 'yellow', suggestion: "Clear skies... feeling bright today?" },
    'Clouds': { mood: 'blue', suggestion: "Cloudy day... time for deep thoughts?" },
};

async function fetchWeather() {
    const widget = document.getElementById('weatherWidget');
    if (!API_CONFIG.OPENWEATHER_KEY || !widget) return;
    
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${API_CONFIG.WEATHER_CITY}&appid=${API_CONFIG.OPENWEATHER_KEY}&units=imperial`
        );
        if (!res.ok) return;
        
        const data = await res.json();
        const weather = data.weather[0].main;
        const temp = Math.round(data.main.temp);
        
        document.getElementById('weatherTemp').textContent = `${temp}°F`;
        document.getElementById('weatherDesc').textContent = data.weather[0].description;
        
        const moodSuggestion = weatherMoodMap[weather] || { suggestion: "How are you feeling?" };
        document.querySelector('.suggestion-text').textContent = moodSuggestion.suggestion;
        
        widget.style.display = 'flex';
    } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════
async function handleDelete(postId) {
    // Only admin can delete
    if (!IS_ADMIN) {
        showToast('Only Aashish can delete posts');
        return;
    }
    
    if (!confirm('Delete this post?')) return;
    
    await deletePost(postId);
    const postEl = document.querySelector(`[data-id="${postId}"]`);
    if (postEl) postEl.remove();
    showToast('Post deleted');
    await updateCounts();
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS SETUP
// ═══════════════════════════════════════════════════════════════
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    
    // Write button
    document.getElementById('writeTrigger')?.addEventListener('click', () => openModal());
    
    // Modal
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') closeModal();
    });
    
    // Login
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        if (IS_ADMIN) {
            logout();
        } else {
            showLoginModal();
        }
    });
    
    document.getElementById('loginModalClose')?.addEventListener('click', hideLoginModal);
    document.getElementById('loginModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'loginModal') hideLoginModal();
    });
    
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login form submitted');
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');
        
        console.log('Attempting login with email:', email);
        
        try {
            await login(email, password);
            console.log('Login successful!');
            hideLoginModal();
            showToast('Welcome back!');
            await renderPosts();
        } catch (err) {
            console.error('Login failed:', err);
            if (errorEl) {
                errorEl.textContent = err.message;
                errorEl.style.display = 'block';
            }
        }
    });
    
    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            
            const titles = { all: 'All Posts', blue: 'Melancholy Posts', yellow: 'Vibrant Posts', red: 'Fiery Posts' };
            document.getElementById('sectionTitle').textContent = titles[currentFilter];
            
            renderPosts();
        });
    });
    
    // Mood selection
    document.querySelectorAll('.mood-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.mood-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedMood = opt.dataset.mood;
            validateForm();
            fetchAIPrompt(selectedMood);
        });
    });
    
    // Post form
    const thoughtInput = document.getElementById('thoughtInput');
    const charCount = document.getElementById('charCount');
    const readingTimePreview = document.getElementById('readingTimePreview');
    
    thoughtInput?.addEventListener('input', () => {
        if (charCount) charCount.textContent = thoughtInput.value.length;
        if (readingTimePreview) readingTimePreview.textContent = calculateReadingTime(thoughtInput.value);
        validateForm();
    });
    
    async function handlePublish() {
        console.log('Publishing...');
        console.log('selectedMood:', selectedMood);
        console.log('thoughtInput value:', thoughtInput?.value);
        console.log('IS_ADMIN:', IS_ADMIN);
        
        if (!selectedMood) {
            showToast('Please select a mood first');
            return;
        }
        
        if (!thoughtInput?.value.trim()) {
            showToast('Please write something first');
            return;
        }
        
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Publishing...';
        }
        
        try {
            console.log('Creating post...');
            await createPost(thoughtInput.value, selectedMood, currentPostImages, currentPostAudio);
            closeModal();
            clearDraft();
            showToast('Post published!');
            await renderPosts();
            await updateCounts();
        } catch (err) {
            console.error('Publish error:', err);
            showToast('Failed to publish: ' + err.message);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Publish';
            }
        }
    }
    
    document.getElementById('postForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handlePublish();
    });
    
    // Also add click handler as fallback
    document.getElementById('submitBtn')?.addEventListener('click', async (e) => {
        if (!e.target.disabled) {
            e.preventDefault();
            await handlePublish();
        }
    });
    
    // Search
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => handleSearch(e.target.value), 300);
    });
    document.getElementById('searchClear')?.addEventListener('click', clearSearch);
    
    // Quote refresh
    document.getElementById('quoteRefresh')?.addEventListener('click', fetchQuote);
    
    // AI prompt refresh
    document.getElementById('aiRefresh')?.addEventListener('click', () => {
        if (selectedMood) fetchAIPrompt(selectedMood);
    });
    
    // Reactions - popup emoji click
    document.addEventListener('click', async (e) => {
        const emojiBtn = e.target.closest('.reaction-emoji');
        if (emojiBtn) {
            const postId = emojiBtn.dataset.postId;
            const reactionType = emojiBtn.dataset.reaction;
            if (!postId || !reactionType) return;
            
            emojiBtn.disabled = true;
            
            // Add bounce animation
            emojiBtn.classList.add('selected');
            
            const added = await toggleReaction(postId, reactionType);
            
            // Update the like button to show the reaction
            const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
            const icon = likeBtn?.querySelector('.like-icon');
            const text = likeBtn?.querySelector('.like-text');
            
            if (added) {
                // Reaction added
                if (icon) icon.textContent = reactionType;
                if (text) text.textContent = ['Love', 'Like', 'Haha', 'Fire', 'Think'][['❤️', '👍', '😂', '🔥', '💭'].indexOf(reactionType)];
                likeBtn?.classList.add('reacted');
                showToast(`Reacted with ${reactionType}`);
            } else {
                // Reaction removed
                if (icon) icon.textContent = '🤍';
                if (text) text.textContent = 'React';
                likeBtn?.classList.remove('reacted');
                showToast('Reaction removed');
            }
            
            // Update summary
            await updateReactionsSummary(postId);
            
            // Hide popup
            const popup = document.querySelector(`.reactions-popup[data-post-id="${postId}"]`);
            if (popup) popup.classList.remove('visible');
            
            setTimeout(() => {
                emojiBtn.classList.remove('selected');
                emojiBtn.disabled = false;
            }, 300);
            
            return;
        }
        
        // Like button click (quick like with heart)
        const likeBtn = e.target.closest('.like-btn');
        if (likeBtn) {
            const postId = likeBtn.dataset.postId;
            if (!postId) return;
            
            // Quick like with heart
            const added = await toggleReaction(postId, '❤️');
            
            const icon = likeBtn.querySelector('.like-icon');
            const text = likeBtn.querySelector('.like-text');
            
            if (added) {
                if (icon) icon.textContent = '❤️';
                if (text) text.textContent = 'Love';
                likeBtn.classList.add('reacted');
                showToast('❤️ Loved');
            } else {
                if (icon) icon.textContent = '🤍';
                if (text) text.textContent = 'React';
                likeBtn.classList.remove('reacted');
                showToast('Reaction removed');
            }
            
            await updateReactionsSummary(postId);
        }
    });
    
    // Reactions popup hover (desktop)
    document.addEventListener('mouseenter', async (e) => {
        const trigger = e.target.closest('.reaction-trigger');
        if (trigger) {
            const postId = trigger.dataset.postId;
            const popup = document.querySelector(`.reactions-popup[data-post-id="${postId}"]`);
            if (popup) {
                await highlightCurrentReaction(postId);
                popup.classList.add('visible');
            }
        }
    }, true);
    
    document.addEventListener('mouseleave', (e) => {
        const trigger = e.target.closest('.reaction-trigger');
        if (trigger) {
            const postId = trigger.dataset.postId;
            setTimeout(() => {
                const popup = document.querySelector(`.reactions-popup[data-post-id="${postId}"]`);
                const isHovering = trigger.matches(':hover') || popup?.matches(':hover');
                if (popup && !isHovering) {
                    popup.classList.remove('visible');
                }
            }, 100);
        }
    }, true);
    
    // Long press for mobile
    let longPressTimer;
    document.addEventListener('touchstart', (e) => {
        const likeBtn = e.target.closest('.like-btn');
        if (likeBtn) {
            const postId = likeBtn.dataset.postId;
            longPressTimer = setTimeout(async () => {
                const popup = document.querySelector(`.reactions-popup[data-post-id="${postId}"]`);
                if (popup) {
                    // Highlight current reaction
                    await highlightCurrentReaction(postId);
                    popup.classList.add('visible');
                    navigator.vibrate?.(10);
                }
            }, 500);
        }
    });
    
    document.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });
    
    document.addEventListener('touchmove', () => {
        clearTimeout(longPressTimer);
    });
    
    // Close share menus and reaction popups on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.share-btn') && !e.target.closest('.share-menu')) {
            document.querySelectorAll('.share-menu').forEach(m => m.classList.remove('visible'));
            document.body.style.overflow = '';
        }
        
        // Close reaction popup when clicking outside (on mobile backdrop)
        if (!e.target.closest('.reaction-trigger') && !e.target.closest('.reactions-popup')) {
            document.querySelectorAll('.reactions-popup').forEach(p => p.classList.remove('visible'));
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key === 'n' && IS_ADMIN) openModal();
        if (e.key === 't') toggleTheme();
        if (e.key === 'Escape') {
            closeModal();
            hideLoginModal();
        }
    });
    
    // Draft buttons
    document.querySelector('.draft-btn')?.addEventListener('click', saveDraft);
    document.querySelector('.restore-btn')?.addEventListener('click', restoreDraft);
    
    // Toolbar formatting
    document.querySelectorAll('.toolbar-btn[data-format]').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format;
            insertFormat(format);
        });
    });
}

function insertFormat(format) {
    const textarea = document.getElementById('thoughtInput');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    const formats = {
        bold: { before: '**', after: '**', placeholder: 'bold text' },
        italic: { before: '*', after: '*', placeholder: 'italic text' },
        underline: { before: '<u>', after: '</u>', placeholder: 'underlined' },
        bullet: { before: '\n- ', after: '', placeholder: 'list item' },
        number: { before: '\n1. ', after: '', placeholder: 'list item' },
        quote: { before: '\n> ', after: '', placeholder: 'quote' },
    };
    
    const f = formats[format];
    if (!f) return;
    
    const insertion = selected || f.placeholder;
    textarea.value = text.substring(0, start) + f.before + insertion + f.after + text.substring(end);
    textarea.focus();
    textarea.dispatchEvent(new Event('input'));
}

// Make functions globally available
window.openModal = openModal;
window.handleDelete = handleDelete;
window.toggleShareMenu = toggleShareMenu;
window.shareToTwitter = shareToTwitter;
window.shareAsImage = shareAsImage;
window.shareToFacebook = shareToFacebook;
window.shareToLinkedIn = shareToLinkedIn;
window.shareToWhatsApp = shareToWhatsApp;
window.shareToTelegram = shareToTelegram;
window.shareViaEmail = shareViaEmail;
window.nativeShare = nativeShare;
window.copyToClipboard = copyToClipboard;
window.removeImage = removeImage;
window.removeAudio = removeAudio;
window.handleImageUpload = handleImageUpload;
window.toggleVoice = toggleVoice;
window.toggleAudioRecording = toggleAudioRecording;
window.saveDraft = saveDraft;
window.restoreDraft = restoreDraft;
window.syncAllPostsToCloud = syncAllPostsToCloud;

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
async function init() {
    initTheme();
    initSupabase();
    
    await checkAuth();
    
    setupEventListeners();
    
    if (IS_ADMIN) {
        displayStreak();
    }
    
    fetchQuote();
    fetchWeather();
    trackVisitor();
    fetchVisitorCount();
    
    await renderPosts();
    await updateCounts();
}

document.addEventListener('DOMContentLoaded', init);
