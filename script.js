// ═══════════════════════════════════════════════════════════════
// AASHISH JOSHI - Personal Blog JavaScript
// Full API Integration: Weather, Quotes, Unsplash, Spotify, AI, Supabase
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// API CONFIGURATION - Add your API keys here
// ═══════════════════════════════════════════════════════════════
const API_CONFIG = {
    // OpenWeatherMap - Get free key at: https://openweathermap.org/api
    OPENWEATHER_KEY: 'a5d032888107167a82e68c30ac1f4ad6',
    WEATHER_CITY: 'Kearny,NJ,US', // Your city
    
    // Unsplash - Get free key at: https://unsplash.com/developers
    UNSPLASH_KEY: '', // Add your key here
    
    // OpenAI - Get key at: https://platform.openai.com/api-keys
    OPENAI_KEY: '', // Add your key here
    
    // Supabase - Get credentials at: https://supabase.com
    SUPABASE_URL: 'https://yexoyqwswfamxtxqzoac.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleG95cXdzd2ZhbXh0eHF6b2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDQ4NTksImV4cCI6MjA4MDEyMDg1OX0.rx1E9v7vsjs45vs3pgXvY8bgLNeJHLCagL3yye0Bjag',
    
    // Spotify - Requires OAuth setup at: https://developer.spotify.com
    SPOTIFY_CLIENT_ID: '',
    SPOTIFY_REDIRECT_URI: window.location.origin,
};

// ═══════════════════════════════════════════════════════════════
// SAMPLE POSTS - Delete these once you have your own content
// ═══════════════════════════════════════════════════════════════
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
    },
    {
        id: 'sample-4',
        text: "Some songs are time machines. One melody and suddenly you're nineteen again, feeling everything with that *devastating intensity*.",
        mood: "blue",
        date: "November 22, 2024",
        timestamp: new Date('2024-11-22').getTime(),
        isSample: true
    },
    {
        id: 'sample-5',
        text: "There's magic in starting fresh:\n\n- New notebook\n- First page\n- Unlimited possibilities\n\nStretching out like an open road at sunrise.",
        mood: "yellow",
        date: "November 20, 2024",
        timestamp: new Date('2024-11-20').getTime(),
        isSample: true
    },
    {
        id: 'sample-6',
        text: "Stop romanticizing burnout. Working yourself into exhaustion isn't dedication—it's a system that profits from your self-destruction.",
        mood: "red",
        date: "November 18, 2024",
        timestamp: new Date('2024-11-18').getTime(),
        isSample: true
    }
];

// ═══════════════════════════════════════════════════════════════
// FALLBACK DATA (when APIs aren't configured)
// ═══════════════════════════════════════════════════════════════
const FALLBACK_QUOTES = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "What we think, we become.", author: "Buddha" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" }
];

const FALLBACK_PROMPTS = {
    blue: [
        "Write about a memory that still visits you on quiet nights.",
        "Describe a goodbye you never got to say.",
        "What would you tell your younger self about the pain they haven't felt yet?",
        "Write about the space between missing someone and moving on.",
        "Describe a moment when silence said more than words ever could."
    ],
    yellow: [
        "Describe a small moment today that made you smile unexpectedly.",
        "Write about something you're grateful for that you usually overlook.",
        "What does your perfect morning look like? Write it into existence.",
        "Describe a person who makes your world brighter just by existing.",
        "Write about a dream you're afraid to admit you have."
    ],
    red: [
        "What's something everyone accepts that you think is completely wrong?",
        "Write about a time you stayed silent when you should have spoken up.",
        "What would you say to someone if there were no consequences?",
        "Describe a system or norm that desperately needs to change.",
        "Write about the anger you've been told to swallow."
    ]
};

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const CONFIG = {
    STORAGE_KEY: 'aashish_blog_posts',
    THEME_KEY: 'aashish_blog_theme',
    STREAK_KEY: 'aashish_blog_streak',
    WORDS_PER_MINUTE: 200,
    ADMIN_KEY: 'aashish2024' // Change this to your secret password
};

// ═══════════════════════════════════════════════════════════════
// ADMIN MODE - Check if user is admin
// ═══════════════════════════════════════════════════════════════
const urlParams = new URLSearchParams(window.location.search);
const IS_ADMIN = urlParams.get('admin') === CONFIG.ADMIN_KEY;
let publicPosts = []; // Cached public posts from posts.json

async function fetchPublicPosts() {
    try {
        const response = await fetch('posts.json');
        if (response.ok) {
            publicPosts = await response.json();
        }
    } catch (e) {
        console.log('Could not load posts.json:', e);
        publicPosts = [];
    }
    return publicPosts;
}

function hideAdminElements() {
    // Hide write/edit elements for non-admins
    const adminElements = [
        '.compose-bar',
        '.write-btn',
        '.delete-btn',
        '#randomBtn',
        '#statsBtn',
        '#exportBtn',
        '#publishBtn',
        '.streak-indicator',
        '#syncStatus'
    ];
    
    adminElements.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
        });
    });
    
    // Add "Read Only" indicator for visitors
    const header = document.querySelector('.profile-header');
    if (header && !document.querySelector('.visitor-badge')) {
        const badge = document.createElement('div');
        badge.className = 'visitor-badge';
        badge.innerHTML = 'Reading Mode';
        badge.style.cssText = 'font-size: 12px; color: var(--text-muted); margin-top: 8px; padding: 4px 12px; background: var(--border-color); border-radius: 12px; display: inline-block;';
        header.appendChild(badge);
    }
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE INITIALIZATION
// ═══════════════════════════════════════════════════════════════
let supabase = null;

function initSupabase() {
    if (API_CONFIG.SUPABASE_URL && API_CONFIG.SUPABASE_KEY) {
        try {
            if (window.supabase && window.supabase.createClient) {
                supabase = window.supabase.createClient(API_CONFIG.SUPABASE_URL, API_CONFIG.SUPABASE_KEY);
                updateSyncStatus('synced');
                return true;
            }
        } catch (e) {
            console.log('Supabase init skipped:', e);
        }
    }
    updateSyncStatus('local');
    return false;
}

function updateSyncStatus(status) {
    const syncEl = document.getElementById('syncStatus');
    const textEl = syncEl.querySelector('.sync-text');
    
    syncEl.classList.remove('synced', 'syncing');
    
    if (status === 'synced') {
        syncEl.classList.add('synced');
        textEl.textContent = 'Synced';
    } else if (status === 'syncing') {
        syncEl.classList.add('syncing');
        textEl.textContent = 'Syncing...';
    } else {
        textEl.textContent = 'Local';
    }
}

// ═══════════════════════════════════════════════════════════════
// LOCAL STORAGE FUNCTIONS
// ═══════════════════════════════════════════════════════════════
function getUserPosts() {
    try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

function saveUserPosts(posts) {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(posts));
}

// Fetch posts from Supabase
async function fetchSupabasePosts() {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('timestamp', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.log('Supabase fetch failed:', e);
        return [];
    }
}

async function getAllPosts() {
    // If Supabase is configured, use it for everyone (admin & visitors)
    if (supabase) {
        const posts = await fetchSupabasePosts();
        if (posts.length > 0) {
            return posts;
        }
    }
    
    // Fallback: PUBLIC MODE - Show posts from posts.json
    if (!IS_ADMIN) {
        if (publicPosts.length === 0) {
            await fetchPublicPosts();
        }
        return publicPosts.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // Fallback: ADMIN MODE - Show user's local posts
    let userPosts = getUserPosts();
    
    // If Supabase is configured, try to fetch from cloud
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('timestamp', { ascending: false });
            
            if (!error && data) {
                userPosts = data;
                saveUserPosts(userPosts); // Cache locally
            }
        } catch (e) {
            console.log('Supabase fetch failed, using local:', e);
        }
    }
    
    const allPosts = [...userPosts, ...samplePosts];
    return allPosts.sort((a, b) => b.timestamp - a.timestamp);
}

async function addPost(text, mood, image = null, audio = null) {
    const now = new Date();
    const newPost = {
        id: 'post-' + Date.now(),
        text: text.trim(),
        mood,
        date: now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        timestamp: now.getTime(),
        image: image,
        audio: audio
    };
    
    // Save locally first (with isSample for local filtering)
    const localPost = { ...newPost, isSample: false };
    const userPosts = getUserPosts();
    userPosts.unshift(localPost);
    saveUserPosts(userPosts);
    
    // Sync to Supabase if configured (only send fields that exist in table)
    if (supabase) {
        updateSyncStatus('syncing');
        try {
            const supabasePost = {
                id: newPost.id,
                text: newPost.text,
                mood: newPost.mood,
                date: newPost.date,
                timestamp: newPost.timestamp,
                image: newPost.image,
                audio: newPost.audio
            };
            const { error } = await supabase.from('posts').insert(supabasePost);
            if (error) {
                console.error('Supabase insert error:', error);
                updateSyncStatus('local');
            } else {
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

async function deletePost(id) {
    const userPosts = getUserPosts();
    const filtered = userPosts.filter(p => p.id !== id);
    saveUserPosts(filtered);
    
    // Delete from Supabase if configured
    if (supabase) {
        updateSyncStatus('syncing');
        try {
            await supabase.from('posts').delete().eq('id', id);
            updateSyncStatus('synced');
        } catch (e) {
            console.log('Supabase delete failed:', e);
            updateSyncStatus('local');
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// THEME (DARK/LIGHT MODE)
// ═══════════════════════════════════════════════════════════════
function initTheme() {
    const savedTheme = localStorage.getItem(CONFIG.THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(CONFIG.THEME_KEY, newTheme);
}

// ═══════════════════════════════════════════════════════════════
// WEATHER API (OpenWeatherMap)
// ═══════════════════════════════════════════════════════════════
const weatherMoodMap = {
    'Rain': { mood: 'blue', suggestion: "Rainy day... perfect for melancholic thoughts?" },
    'Drizzle': { mood: 'blue', suggestion: "Light drizzle outside... feeling reflective?" },
    'Thunderstorm': { mood: 'red', suggestion: "Storm brewing... channel that energy!" },
    'Snow': { mood: 'blue', suggestion: "Snow falling... a quiet, contemplative mood?" },
    'Clear': { mood: 'yellow', suggestion: "Clear skies... feeling bright today?" },
    'Clouds': { mood: 'blue', suggestion: "Cloudy day... time for deep thoughts?" },
    'Mist': { mood: 'blue', suggestion: "Misty morning... what's on your mind?" },
    'Fog': { mood: 'blue', suggestion: "Foggy day... perfect for introspection." }
};

const weatherEmojis = {
    'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Drizzle': '🌦️',
    'Thunderstorm': '⛈️', 'Snow': '❄️', 'Mist': '🌫️', 'Fog': '🌫️',
    'Haze': '🌫️', 'Smoke': '💨', 'Dust': '💨'
};

async function fetchWeather() {
    const weatherWidget = document.getElementById('weatherWidget');
    
    if (!API_CONFIG.OPENWEATHER_KEY) {
        if (weatherWidget) weatherWidget.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${API_CONFIG.WEATHER_CITY}&appid=${API_CONFIG.OPENWEATHER_KEY}&units=metric`
        );
        
        // Check if API key is valid
        if (!response.ok) {
            console.log('Weather API: Key may not be activated yet (takes up to 2 hours for new keys)');
            if (weatherWidget) weatherWidget.style.display = 'none';
            return;
        }
        
        const data = await response.json();
        
        if (data.main && data.weather) {
            const weather = data.weather[0].main;
            const temp = Math.round(data.main.temp);
            const desc = data.weather[0].description;
            
            const weatherIcon = document.getElementById('weatherIcon');
            const weatherTemp = document.getElementById('weatherTemp');
            const weatherDesc = document.getElementById('weatherDesc');
            const suggestionText = document.querySelector('.suggestion-text');
            const suggestionBtn = document.getElementById('suggestionBtn');
            
            if (weatherIcon) weatherIcon.textContent = weatherEmojis[weather] || '🌤️';
            if (weatherTemp) weatherTemp.textContent = `${temp}°C`;
            if (weatherDesc) weatherDesc.textContent = desc.charAt(0).toUpperCase() + desc.slice(1);
            
            const moodSuggestion = weatherMoodMap[weather] || { mood: 'yellow', suggestion: "How are you feeling?" };
            if (suggestionText) suggestionText.textContent = moodSuggestion.suggestion;
            if (suggestionBtn) suggestionBtn.dataset.mood = moodSuggestion.mood;
            
            if (weatherWidget) weatherWidget.style.display = 'flex';
        }
    } catch (e) {
        // Silently fail - don't show errors for weather
        if (weatherWidget) weatherWidget.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════
// QUOTES API (Quotable.io - Free, No Key Required)
// ═══════════════════════════════════════════════════════════════
async function fetchQuote() {
    const refreshBtn = document.getElementById('quoteRefresh');
    if (refreshBtn) refreshBtn.classList.add('loading');
    
    // Use fallback quotes directly (APIs often have CORS issues from localhost)
    const quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    
    const quoteText = document.getElementById('quoteText');
    const quoteAuthor = document.getElementById('quoteAuthor');
    
    if (quoteText && quoteAuthor) {
        quoteText.textContent = `"${quote.text}"`;
        quoteAuthor.textContent = `— ${quote.author}`;
    }
    
    if (refreshBtn) refreshBtn.classList.remove('loading');
}

// ═══════════════════════════════════════════════════════════════
// UNSPLASH BACKGROUND IMAGES
// ═══════════════════════════════════════════════════════════════
const unsplashQueries = {
    blue: 'moody,rain,ocean,melancholy',
    yellow: 'sunshine,happy,bright,nature',
    red: 'fire,passion,energy,storm',
    all: 'aesthetic,minimal,nature'
};

async function fetchBackground(mood = 'all') {
    if (!API_CONFIG.UNSPLASH_KEY) return;
    
    const overlay = document.getElementById('bgOverlay');
    const query = unsplashQueries[mood] || unsplashQueries.all;
    
    try {
        const response = await fetch(
            `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${API_CONFIG.UNSPLASH_KEY}`
        );
        const data = await response.json();
        
        if (data.urls) {
            const img = new Image();
            img.onload = () => {
                overlay.style.backgroundImage = `url(${data.urls.regular})`;
                overlay.classList.add('visible');
            };
            img.src = data.urls.regular;
        }
    } catch (e) {
        console.log('Unsplash fetch failed:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// SPOTIFY INTEGRATION (Requires OAuth)
// ═══════════════════════════════════════════════════════════════
// Note: Full Spotify integration requires setting up OAuth flow
// This is a placeholder that shows the widget structure

function initSpotify() {
    if (!API_CONFIG.SPOTIFY_CLIENT_ID) {
        document.getElementById('spotifyWidget').style.display = 'none';
        return;
    }
    
    // Check for access token in URL hash (after OAuth redirect)
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
        const token = hash.split('access_token=')[1].split('&')[0];
        localStorage.setItem('spotify_token', token);
        window.location.hash = '';
        fetchNowPlaying(token);
    } else {
        const savedToken = localStorage.getItem('spotify_token');
        if (savedToken) {
            fetchNowPlaying(savedToken);
        }
    }
    
    document.getElementById('spotifyWidget').style.display = 'block';
}

async function fetchNowPlaying(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 200) {
            const data = await response.json();
            if (data.item) {
                document.getElementById('spotifyTrack').textContent = data.item.name;
                document.getElementById('spotifyArtist').textContent = data.item.artists.map(a => a.name).join(', ');
            }
        } else if (response.status === 204) {
            document.getElementById('spotifyTrack').textContent = 'Nothing playing';
            document.getElementById('spotifyArtist').textContent = 'Start some music!';
        }
    } catch (e) {
        console.log('Spotify fetch failed:', e);
    }
}

function connectSpotify() {
    const scopes = 'user-read-currently-playing user-read-playback-state';
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${API_CONFIG.SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(API_CONFIG.SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = authUrl;
}

// ═══════════════════════════════════════════════════════════════
// AI WRITING PROMPTS (OpenAI or Fallback)
// ═══════════════════════════════════════════════════════════════
let currentPromptMood = null;

async function fetchAIPrompt(mood) {
    currentPromptMood = mood;
    const promptText = document.getElementById('aiPromptText');
    const refreshBtn = document.getElementById('aiRefresh');
    
    refreshBtn.classList.add('loading');
    
    if (API_CONFIG.OPENAI_KEY) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_CONFIG.OPENAI_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'user',
                        content: `Give me a single creative, introspective writing prompt for someone feeling ${mood === 'blue' ? 'melancholic or reflective' : mood === 'yellow' ? 'happy and vibrant' : 'passionate or frustrated'}. Keep it under 20 words. Just the prompt, no quotes or explanation.`
                    }],
                    max_tokens: 50,
                    temperature: 0.9
                })
            });
            
            const data = await response.json();
            if (data.choices && data.choices[0]) {
                promptText.textContent = data.choices[0].message.content;
                refreshBtn.classList.remove('loading');
                return;
            }
        } catch (e) {
            console.log('OpenAI fetch failed:', e);
        }
    }
    
    // Fallback to local prompts
    const prompts = FALLBACK_PROMPTS[mood] || FALLBACK_PROMPTS.yellow;
    promptText.textContent = prompts[Math.floor(Math.random() * prompts.length)];
    refreshBtn.classList.remove('loading');
}

// ═══════════════════════════════════════════════════════════════
// STREAK TRACKER
// ═══════════════════════════════════════════════════════════════
function getStreakData() {
    try {
        const stored = localStorage.getItem(CONFIG.STREAK_KEY);
        return stored ? JSON.parse(stored) : { count: 0, lastDate: null };
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
    } else if (lastDate !== today) {
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
    
    if (streak.count >= 2) {
        banner.style.display = 'flex';
        text.textContent = `${streak.count} day streak`;
    } else {
        banner.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════
// READING TIME
// ═══════════════════════════════════════════════════════════════
function calculateReadingTime(text) {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / CONFIG.WORDS_PER_MINUTE);
    return minutes < 1 ? '< 1 min read' : `${minutes} min read`;
}

// ═══════════════════════════════════════════════════════════════
// MARKDOWN PARSING
// ═══════════════════════════════════════════════════════════════
function parseMarkdown(text) {
    if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true });
        return marked.parse(text);
    }
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT POSTS
// ═══════════════════════════════════════════════════════════════
function exportPosts() {
    const userPosts = getUserPosts();
    
    if (userPosts.length === 0) {
        showToast('No posts to export');
        return;
    }
    
    const exportData = {
        exportDate: new Date().toISOString(),
        totalPosts: userPosts.length,
        posts: userPosts
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aashish-blog-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${userPosts.length} posts`);
}

// Publish posts - creates the posts.json file format
function publishPosts() {
    const userPosts = getUserPosts();
    
    if (userPosts.length === 0) {
        showToast('No posts to publish');
        return;
    }
    
    // Clean posts for publishing (remove sample posts, keep only essential fields)
    const publishData = userPosts.map(post => ({
        id: post.id,
        text: post.text,
        mood: post.mood,
        date: post.date,
        timestamp: post.timestamp,
        image: post.image || null,
        audio: post.audio || null
    }));
    
    const blob = new Blob([JSON.stringify(publishData, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`Published ${userPosts.length} posts! Replace your posts.json file with this.`);
}

// ═══════════════════════════════════════════════════════════════
// SHARE FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════
function shareToTwitter(text) {
    const truncated = text.length > 250 ? text.substring(0, 247) + '...' : text;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(truncated)}`;
    window.open(url, '_blank', 'width=550,height=420');
}

function shareToWhatsApp(text) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard');
    }).catch(() => {
        showToast('Failed to copy');
    });
}

function toggleShareMenu(postId) {
    document.querySelectorAll('.share-menu').forEach(menu => {
        if (menu.id !== `share-menu-${postId}`) {
            menu.classList.remove('visible');
        }
    });
    
    const menu = document.getElementById(`share-menu-${postId}`);
    if (menu) menu.classList.toggle('visible');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.share-btn') && !e.target.closest('.share-menu')) {
        document.querySelectorAll('.share-menu').forEach(menu => {
            menu.classList.remove('visible');
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// TOAST NOTIFICATION
// ═══════════════════════════════════════════════════════════════
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.add('visible');
    
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 2500);
}

// ═══════════════════════════════════════════════════════════════
// SEARCH FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════
let searchQuery = '';

function handleSearch(query) {
    searchQuery = query.toLowerCase().trim();
    renderPosts();
    document.getElementById('searchClear').style.display = query ? 'block' : 'none';
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    document.getElementById('searchClear').style.display = 'none';
    renderPosts();
}

// ═══════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════
const postsList = document.getElementById('postsList');
const sectionTitle = document.getElementById('sectionTitle');
const resultsCount = document.getElementById('resultsCount');
const filterBtns = document.querySelectorAll('.filter-btn');
const writeTrigger = document.getElementById('writeTrigger');
const themeToggle = document.getElementById('themeToggle');
const exportBtn = document.getElementById('exportBtn');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const quoteRefresh = document.getElementById('quoteRefresh');
const suggestionBtn = document.getElementById('suggestionBtn');
const aiRefresh = document.getElementById('aiRefresh');

const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const postForm = document.getElementById('postForm');
const thoughtInput = document.getElementById('thoughtInput');
const charCount = document.getElementById('charCount');
const readingTimePreview = document.getElementById('readingTimePreview');
const submitBtn = document.getElementById('submitBtn');
const moodOptions = document.querySelectorAll('.mood-option');

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let currentFilter = 'all';
let selectedMood = null;

const moodLabels = { blue: 'Melancholy', yellow: 'Vibrant', red: 'Fiery' };
const moodEmojis = { blue: '🌊', yellow: '✨', red: '🔥' };
const sectionTitles = {
    all: 'All Posts',
    blue: 'Melancholy Posts',
    yellow: 'Vibrant Posts',
    red: 'Fiery Posts'
};

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
if (exportBtn) exportBtn.addEventListener('click', exportPosts);

const publishBtn = document.getElementById('publishBtn');
if (publishBtn) publishBtn.addEventListener('click', publishPosts);
if (searchInput) searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
if (searchClear) searchClear.addEventListener('click', clearSearch);
if (quoteRefresh) quoteRefresh.addEventListener('click', fetchQuote);

// Weather suggestion button
if (suggestionBtn) {
    suggestionBtn.addEventListener('click', () => {
        const mood = suggestionBtn.dataset.mood || 'yellow';
        openModal(mood);
    });
}

// AI prompt refresh
if (aiRefresh) {
    aiRefresh.addEventListener('click', () => {
        if (currentPromptMood) {
            fetchAIPrompt(currentPromptMood);
        }
    });
}

// Filter buttons
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        sectionTitle.textContent = sectionTitles[currentFilter];
        
        // Update background for mood
        if (API_CONFIG.UNSPLASH_KEY) {
            fetchBackground(currentFilter);
        }
        
        renderPosts();
    });
});

// Modal triggers
if (writeTrigger) writeTrigger.addEventListener('click', () => openModal());
if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

// Mood selection in form
moodOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        moodOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedMood = opt.dataset.mood;
        validateForm();
        
        // Fetch AI prompt for selected mood
        fetchAIPrompt(selectedMood);
    });
});

// Editor Toolbar
const toolbarBtns = document.querySelectorAll('.toolbar-btn');
toolbarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        if (thoughtInput) {
            insertFormat(format);
        }
    });
});

function insertFormat(format) {
    const textarea = thoughtInput;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let before = '';
    let after = '';
    let placeholder = '';
    
    switch(format) {
        case 'bold':
            before = '**';
            after = '**';
            placeholder = 'bold text';
            break;
        case 'italic':
            before = '*';
            after = '*';
            placeholder = 'italic text';
            break;
        case 'underline':
            before = '<u>';
            after = '</u>';
            placeholder = 'underlined text';
            break;
        case 'bullet':
            before = '\n- ';
            after = '';
            placeholder = 'list item';
            break;
        case 'number':
            before = '\n1. ';
            after = '';
            placeholder = 'list item';
            break;
        case 'quote':
            before = '\n> ';
            after = '';
            placeholder = 'quote';
            break;
    }
    
    const insertion = selectedText || placeholder;
    const newText = text.substring(0, start) + before + insertion + after + text.substring(end);
    
    textarea.value = newText;
    textarea.focus();
    
    // Set cursor position
    const newCursorPos = start + before.length + insertion.length + after.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    // Trigger input event for character count
    textarea.dispatchEvent(new Event('input'));
}

// Text input
if (thoughtInput) {
    thoughtInput.addEventListener('input', () => {
        const text = thoughtInput.value;
        if (charCount) charCount.textContent = text.length;
        if (readingTimePreview) readingTimePreview.textContent = calculateReadingTime(text);
        validateForm();
    });
}

// Form submission
if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (selectedMood && thoughtInput && thoughtInput.value.trim()) {
            const scheduleDate = document.getElementById('scheduleDate')?.value;
            
            if (scheduleDate && new Date(scheduleDate) > new Date()) {
                // Schedule for later
                schedulePost({
                    text: thoughtInput.value,
                    mood: selectedMood,
                    image: currentPostImage,
                    audio: currentPostAudio
                }, scheduleDate);
            } else {
                // Publish now
                await addPost(thoughtInput.value, selectedMood, currentPostImage, currentPostAudio);
                showToast('Post published!');
            }
            
            // Clear draft and reset
            clearDraft();
            currentPostImage = null;
            currentPostAudio = null;
            removeImage();
            removeAudio();
            closeModal();
            await renderPosts();
            updateCounts();
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════
async function renderPosts() {
    let allPosts = await getAllPosts();
    
    let filtered = currentFilter === 'all' 
        ? allPosts 
        : allPosts.filter(p => p.mood === currentFilter);
    
    if (searchQuery) {
        filtered = filtered.filter(p => 
            p.text.toLowerCase().includes(searchQuery) ||
            p.date.toLowerCase().includes(searchQuery) ||
            moodLabels[p.mood].toLowerCase().includes(searchQuery)
        );
    }
    
    if (searchQuery) {
        resultsCount.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;
    } else {
        resultsCount.textContent = '';
    }

    if (filtered.length === 0) {
        postsList.innerHTML = `
            <div class="empty-state">
                <p>${searchQuery ? 'No posts match your search.' : 'No posts here yet. Time to write something!'}</p>
                ${!searchQuery ? `
                    <button class="write-btn" onclick="openModal()">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Post
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }

    postsList.innerHTML = filtered.map(post => `
        <article class="post-card ${post.isSample ? '' : 'user-post'} ${post.mood}">
            <div class="post-meta">
                <span class="post-mood ${post.mood}">${moodEmojis[post.mood]} ${moodLabels[post.mood]}</span>
                <span class="post-date">${post.date}</span>
                <span class="post-reading-time">${calculateReadingTime(post.text)}</span>
                <div class="post-actions">
                    <div style="position: relative;">
                        <button class="share-btn" onclick="toggleShareMenu('${post.id}')" title="Share">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </button>
                        <div class="share-menu" id="share-menu-${post.id}">
                            <button class="share-menu-item" onclick="shareToTwitter(\`${escapeForAttr(post.text)}\`)">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter
                            </button>
                            <button class="share-menu-item" onclick="shareToWhatsApp(\`${escapeForAttr(post.text)}\`)">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                WhatsApp
                            </button>
                            <button class="share-menu-item" onclick="copyToClipboard(\`${escapeForAttr(post.text)}\`)">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy text
                            </button>
                        </div>
                    </div>
                    ${!post.isSample ? `
                        <button class="delete-btn" onclick="handleDelete('${post.id}')" title="Delete post">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="post-content">${parseMarkdown(post.text)}</div>
            ${post.image ? `<div class="post-image"><img src="${post.image}" alt="Post image"></div>` : ''}
            ${post.audio ? `<div class="post-audio"><audio controls src="${post.audio}"></audio></div>` : ''}
        </article>
    `).join('');
}

function escapeForAttr(text) {
    return text.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

async function updateCounts() {
    const allPosts = await getAllPosts();
    document.getElementById('countAll').textContent = allPosts.length;
    document.getElementById('countBlue').textContent = allPosts.filter(p => p.mood === 'blue').length;
    document.getElementById('countYellow').textContent = allPosts.filter(p => p.mood === 'yellow').length;
    document.getElementById('countRed').textContent = allPosts.filter(p => p.mood === 'red').length;
}

function openModal(preselectedMood = null) {
    if (thoughtInput) thoughtInput.value = '';
    if (charCount) charCount.textContent = '0';
    if (readingTimePreview) readingTimePreview.textContent = '< 1 min read';
    moodOptions.forEach(o => o.classList.remove('selected'));
    selectedMood = null;
    currentPromptMood = null;
    
    const aiPromptText = document.getElementById('aiPromptText');
    if (aiPromptText) aiPromptText.textContent = 'Select a mood to get a writing prompt...';
    
    // Pre-select mood if provided (from weather suggestion)
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
    if (modalOverlay) modalOverlay.classList.remove('visible');
}

function validateForm() {
    const hasText = thoughtInput && thoughtInput.value.trim().length > 0;
    const hasMood = selectedMood !== null;
    if (submitBtn) submitBtn.disabled = !(hasText && hasMood);
}

async function handleDelete(id) {
    if (confirm('Delete this post?')) {
        await deletePost(id);
        await renderPosts();
        await updateCounts();
        showToast('Post deleted');
    }
}

// Make functions available globally
window.openModal = openModal;
window.handleDelete = handleDelete;
window.toggleShareMenu = toggleShareMenu;
window.shareToTwitter = shareToTwitter;
window.shareToWhatsApp = shareToWhatsApp;
window.copyToClipboard = copyToClipboard;
window.connectSpotify = connectSpotify;

// ═══════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
    // Don't trigger if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // N - New post
    if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openModal();
    }
    
    // T - Toggle theme
    if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
    }
    
    // Escape - Close modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // S - Focus search
    if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
});

// ═══════════════════════════════════════════════════════════════
// DRAFT AUTO-SAVE
// ═══════════════════════════════════════════════════════════════
const DRAFT_KEY = 'moodring_draft';

function saveDraft() {
    if (!thoughtInput) return;
    const draft = {
        text: thoughtInput.value,
        mood: selectedMood,
        image: currentPostImage,
        scheduleDate: document.getElementById('scheduleDate')?.value || '',
        savedAt: new Date().toISOString()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    showToast('Draft saved');
}

function loadDraft() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
}

function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
}

function restoreDraft() {
    const draft = loadDraft();
    if (!draft || !draft.text) return;
    
    if (thoughtInput) thoughtInput.value = draft.text;
    if (charCount) charCount.textContent = draft.text.length;
    
    if (draft.mood) {
        const moodBtn = document.querySelector(`.mood-option.${draft.mood}`);
        if (moodBtn) {
            moodOptions.forEach(o => o.classList.remove('selected'));
            moodBtn.classList.add('selected');
            selectedMood = draft.mood;
        }
    }
    
    if (draft.image) {
        currentPostImage = draft.image;
        showImagePreview(draft.image);
    }
    
    if (draft.scheduleDate) {
        const scheduleDateInput = document.getElementById('scheduleDate');
        if (scheduleDateInput) scheduleDateInput.value = draft.scheduleDate;
    }
    
    validateForm();
    showToast('Draft restored');
}

// Auto-save every 10 seconds while typing
let autoSaveTimer = null;
if (thoughtInput) {
    thoughtInput.addEventListener('input', () => {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            if (thoughtInput.value.trim()) {
                saveDraft();
            }
        }, 10000);
    });
}

// ═══════════════════════════════════════════════════════════════
// VOICE TO TEXT
// ═══════════════════════════════════════════════════════════════
let recognition = null;
let isListening = false;

function initVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Speech recognition not supported');
        return false;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        
        if (thoughtInput && transcript) {
            const cursorPos = thoughtInput.selectionStart;
            const text = thoughtInput.value;
            thoughtInput.value = text.substring(0, cursorPos) + transcript + text.substring(cursorPos);
            thoughtInput.dispatchEvent(new Event('input'));
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopVoiceRecognition();
        showToast('Voice recognition error');
    };
    
    recognition.onend = () => {
        if (isListening) {
            recognition.start(); // Restart if still listening
        }
    };
    
    return true;
}

function startVoiceRecognition() {
    if (!recognition && !initVoiceRecognition()) {
        showToast('Voice not supported in this browser');
        return;
    }
    
    try {
        recognition.start();
        isListening = true;
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) voiceBtn.classList.add('listening');
        showToast('Listening...');
    } catch (e) {
        console.error('Voice start error:', e);
    }
}

function stopVoiceRecognition() {
    if (recognition) {
        recognition.stop();
    }
    isListening = false;
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) voiceBtn.classList.remove('listening');
}

function toggleVoice() {
    // Check if running on file:// protocol
    if (window.location.protocol === 'file:') {
        showToast('Voice requires a local server (use Live Server)');
        return;
    }
    
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice not supported - use Chrome or Edge');
        return;
    }
    
    if (isListening) {
        stopVoiceRecognition();
        showToast('Stopped listening');
    } else {
        startVoiceRecognition();
    }
}

// ═══════════════════════════════════════════════════════════════
// AUDIO RECORDING (Voice Clips)
// ═══════════════════════════════════════════════════════════════
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let currentPostAudio = null;
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
        
        mediaRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = (e) => {
                currentPostAudio = e.target.result;
                showAudioPreview(currentPostAudio);
            };
            reader.readAsDataURL(audioBlob);
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        recordingSeconds = 0;
        
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.classList.add('recording');
            recordBtn.title = 'Stop Recording';
        }
        
        // Update timer every second
        recordingTimer = setInterval(() => {
            recordingSeconds++;
            showToast(`Recording... ${recordingSeconds}s`);
            
            // Max 60 seconds
            if (recordingSeconds >= 60) {
                stopAudioRecording();
            }
        }, 1000);
        
        showToast('Recording started...');
        
    } catch (err) {
        console.error('Microphone access error:', err);
        showToast('Could not access microphone');
    }
}

function stopAudioRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        clearInterval(recordingTimer);
        
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.classList.remove('recording');
            recordBtn.title = 'Record Voice Clip';
        }
        
        showToast(`Voice clip saved (${recordingSeconds}s)`);
    }
}

function showAudioPreview(src) {
    const preview = document.getElementById('audioPreview');
    if (preview) {
        preview.innerHTML = `
            <div class="audio-preview-content">
                <span class="audio-label">Voice Clip</span>
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
// IMAGE UPLOAD
// ═══════════════════════════════════════════════════════════════
let currentPostImage = null;

function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Please select an image file');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be under 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        currentPostImage = e.target.result;
        showImagePreview(currentPostImage);
        showToast('Image added');
    };
    reader.readAsDataURL(file);
}

function showImagePreview(src) {
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.innerHTML = `
            <img src="${src}" alt="Preview">
            <button type="button" class="remove-image" onclick="removeImage()">×</button>
        `;
        preview.style.display = 'block';
    }
}

function removeImage() {
    currentPostImage = null;
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.innerHTML = '';
        preview.style.display = 'none';
    }
    const imageInput = document.getElementById('imageInput');
    if (imageInput) imageInput.value = '';
}

// ═══════════════════════════════════════════════════════════════
// POST SCHEDULING
// ═══════════════════════════════════════════════════════════════
const SCHEDULED_KEY = 'moodring_scheduled';

function getScheduledPosts() {
    try {
        return JSON.parse(localStorage.getItem(SCHEDULED_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveScheduledPosts(posts) {
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(posts));
}

function schedulePost(post, scheduleDate) {
    const scheduled = getScheduledPosts();
    scheduled.push({
        ...post,
        scheduledFor: scheduleDate,
        id: 'scheduled_' + Date.now()
    });
    saveScheduledPosts(scheduled);
    showToast(`Post scheduled for ${new Date(scheduleDate).toLocaleDateString()}`);
}

function checkScheduledPosts() {
    const scheduled = getScheduledPosts();
    const now = new Date();
    const toPublish = [];
    const remaining = [];
    
    scheduled.forEach(post => {
        if (new Date(post.scheduledFor) <= now) {
            toPublish.push(post);
        } else {
            remaining.push(post);
        }
    });
    
    if (toPublish.length > 0) {
        toPublish.forEach(post => {
            const newPost = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                text: post.text,
                mood: post.mood,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                image: post.image || null
            };
            const userPosts = getUserPosts();
            userPosts.unshift(newPost);
            saveUserPosts(userPosts);
        });
        
        saveScheduledPosts(remaining);
        renderPosts();
        updateCounts();
        showToast(`${toPublish.length} scheduled post(s) published!`);
    }
}

// Check scheduled posts every minute
setInterval(checkScheduledPosts, 60000);

// ═══════════════════════════════════════════════════════════════
// RANDOM POST
// ═══════════════════════════════════════════════════════════════
const randomPostBtn = document.getElementById('randomPostBtn');
const randomPostOverlay = document.getElementById('randomPostOverlay');
const randomPostClose = document.getElementById('randomPostClose');
const randomPostContent = document.getElementById('randomPostContent');
const shuffleBtn = document.getElementById('shuffleBtn');

async function showRandomPost() {
    const allPosts = await getAllPosts();
    if (allPosts.length === 0) {
        showToast('No posts yet!');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * allPosts.length);
    const post = allPosts[randomIndex];
    
    randomPostContent.innerHTML = `
        <div class="random-post-card ${post.mood}">
            <span class="post-mood ${post.mood}">${moodLabels[post.mood]}</span>
            <span class="post-date">${post.date}</span>
            <div class="post-content">${parseMarkdown(post.text)}</div>
            ${post.image ? `<img src="${post.image}" alt="Post image" class="random-post-image">` : ''}
            ${post.audio ? `<audio controls src="${post.audio}" class="random-post-audio"></audio>` : ''}
        </div>
    `;
    
    randomPostOverlay.classList.add('visible');
}

if (randomPostBtn) randomPostBtn.addEventListener('click', showRandomPost);
if (shuffleBtn) shuffleBtn.addEventListener('click', showRandomPost);
if (randomPostClose) randomPostClose.addEventListener('click', () => randomPostOverlay.classList.remove('visible'));
if (randomPostOverlay) randomPostOverlay.addEventListener('click', (e) => {
    if (e.target === randomPostOverlay) randomPostOverlay.classList.remove('visible');
});

// ═══════════════════════════════════════════════════════════════
// MOOD STATISTICS
// ═══════════════════════════════════════════════════════════════
const statsBtn = document.getElementById('statsBtn');
const statsModalOverlay = document.getElementById('statsModalOverlay');
const statsModalClose = document.getElementById('statsModalClose');

async function showMoodStats() {
    const allPosts = await getAllPosts();
    const userPosts = allPosts.filter(p => !p.isSample);
    
    const blue = userPosts.filter(p => p.mood === 'blue').length;
    const yellow = userPosts.filter(p => p.mood === 'yellow').length;
    const red = userPosts.filter(p => p.mood === 'red').length;
    const total = userPosts.length;
    const max = Math.max(blue, yellow, red, 1);
    
    // Update chart
    document.getElementById('statsBlue').textContent = blue;
    document.getElementById('statsYellow').textContent = yellow;
    document.getElementById('statsRed').textContent = red;
    
    document.querySelector('#chartBlue .chart-fill').style.width = `${(blue / max) * 100}%`;
    document.querySelector('#chartYellow .chart-fill').style.width = `${(yellow / max) * 100}%`;
    document.querySelector('#chartRed .chart-fill').style.width = `${(red / max) * 100}%`;
    
    // Update summary
    document.getElementById('statTotal').textContent = total;
    
    let dominant = '-';
    if (blue > yellow && blue > red) dominant = 'Melancholy';
    else if (yellow > blue && yellow > red) dominant = 'Vibrant';
    else if (red > blue && red > yellow) dominant = 'Fiery';
    else if (total > 0) dominant = 'Balanced';
    document.getElementById('statDominant').textContent = dominant;
    
    const streak = getStreakData();
    document.getElementById('statStreak').textContent = streak.count;
    
    statsModalOverlay.classList.add('visible');
}

if (statsBtn) statsBtn.addEventListener('click', showMoodStats);
if (statsModalClose) statsModalClose.addEventListener('click', () => statsModalOverlay.classList.remove('visible'));
if (statsModalOverlay) statsModalOverlay.addEventListener('click', (e) => {
    if (e.target === statsModalOverlay) statsModalOverlay.classList.remove('visible');
});

// ═══════════════════════════════════════════════════════════════
// MINI GAME - MOOD CATCHER (Easter Egg)
// ═══════════════════════════════════════════════════════════════
const gameOverlay = document.getElementById('gameOverlay');
const gameArea = document.getElementById('gameArea');
const gamePaddle = document.getElementById('gamePaddle');
const gameScoreEl = document.getElementById('gameScore');
const gameClose = document.getElementById('gameClose');

let gameActive = false;
let gameScore = 0;
let paddleX = 50;
let gameInterval = null;
let spawnInterval = null;

// Konami Code Easter Egg: ↑↑↓↓←→←→BA
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    // Check Konami code
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            konamiIndex = 0;
            startGame();
        }
    } else {
        konamiIndex = 0;
    }
    
    // Game controls
    if (gameActive) {
        if (e.key === 'ArrowLeft') {
            paddleX = Math.max(0, paddleX - 10);
            gamePaddle.style.left = paddleX + '%';
        }
        if (e.key === 'ArrowRight') {
            paddleX = Math.min(85, paddleX + 10);
            gamePaddle.style.left = paddleX + '%';
        }
    }
});

// Touch controls for mobile
if (gameArea) {
    gameArea.addEventListener('touchmove', (e) => {
        if (!gameActive) return;
        const touch = e.touches[0];
        const rect = gameArea.getBoundingClientRect();
        paddleX = ((touch.clientX - rect.left) / rect.width) * 100 - 7.5;
        paddleX = Math.max(0, Math.min(85, paddleX));
        gamePaddle.style.left = paddleX + '%';
    });
}

function startGame() {
    gameOverlay.classList.add('visible');
    gameActive = true;
    gameScore = 0;
    gameScoreEl.textContent = '0';
    paddleX = 50;
    gamePaddle.style.left = '50%';
    
    // Clear existing moods
    document.querySelectorAll('.falling-mood').forEach(el => el.remove());
    
    // Spawn falling moods
    spawnInterval = setInterval(spawnMood, 1000);
    
    // Game loop
    gameInterval = setInterval(updateGame, 50);
    
    showToast('Catch the moods!');
}

function spawnMood() {
    if (!gameActive) return;
    
    const moods = ['blue', 'yellow', 'red'];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const moodEl = document.createElement('div');
    moodEl.className = `falling-mood ${mood}`;
    moodEl.style.left = Math.random() * 90 + '%';
    moodEl.style.top = '0';
    moodEl.dataset.mood = mood;
    gameArea.appendChild(moodEl);
}

function updateGame() {
    if (!gameActive) return;
    
    const moods = document.querySelectorAll('.falling-mood');
    const paddleRect = gamePaddle.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    
    moods.forEach(moodEl => {
        const top = parseFloat(moodEl.style.top) || 0;
        moodEl.style.top = (top + 2) + '%';
        
        // Check collision with paddle
        const moodRect = moodEl.getBoundingClientRect();
        if (moodRect.bottom >= paddleRect.top && 
            moodRect.left < paddleRect.right && 
            moodRect.right > paddleRect.left &&
            moodRect.top < paddleRect.bottom) {
            // Caught!
            gameScore += 10;
            gameScoreEl.textContent = gameScore;
            moodEl.remove();
        }
        
        // Missed
        if (top > 100) {
            moodEl.remove();
        }
    });
}

function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    gameOverlay.classList.remove('visible');
    showToast(`Game Over! Score: ${gameScore}`);
}

if (gameClose) gameClose.addEventListener('click', endGame);

// ═══════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS - Add R for random
// ═══════════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (gameActive) return;
    
    // R - Random post
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        showRandomPost();
    }
});

// ═══════════════════════════════════════════════════════════════
// INITIALIZE
// ═══════════════════════════════════════════════════════════════
async function init() {
    initTheme();
    
    // Initialize Supabase FIRST (for both admin and visitors)
    initSupabase();
    
    // Small delay to ensure Supabase is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fetch public posts as fallback if Supabase fails
    if (!IS_ADMIN) {
        await fetchPublicPosts();
    }
    
    initSpotify();
    
    // Only show admin features for admin
    if (IS_ADMIN) {
        displayStreak();
        // Show admin badge
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) adminBadge.style.display = 'inline-block';
        console.log('🔓 Admin mode active');
    } else {
        // Hide admin-only elements after DOM is ready
        setTimeout(hideAdminElements, 100);
        console.log('👁️ Visitor mode - read only');
    }
    
    // Fetch APIs
    fetchWeather();
    fetchQuote();
    
    // Initial background
    if (API_CONFIG.UNSPLASH_KEY) {
        fetchBackground('all');
    }
    
    // Check scheduled posts on load (admin only)
    if (IS_ADMIN) {
        checkScheduledPosts();
    }
    
    // Render posts
    await renderPosts();
    await updateCounts();
}

// Start the app
init();
