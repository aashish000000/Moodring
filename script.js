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
let currentPostImage = null;
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
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(posts));
}

async function getAllPosts() {
    // Try Supabase first
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('posts')
                .select('*')
                .order('timestamp', { ascending: false });
            
            if (!error && data && data.length > 0) {
                return data;
            }
        } catch (e) {
            console.log('Supabase fetch failed:', e);
        }
    }
    
    // Fallback to local + samples
    const localPosts = getLocalPosts();
    const allPosts = [...localPosts, ...samplePosts];
    return allPosts.sort((a, b) => b.timestamp - a.timestamp);
}

async function createPost(text, mood, image = null, audio = null) {
    const now = new Date();
    const newPost = {
        id: 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        text: text.trim(),
        mood,
        date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        timestamp: now.getTime(),
        image,
        audio,
    };
    
    // Save locally
    const localPosts = getLocalPosts();
    localPosts.unshift({ ...newPost, isSample: false });
    saveLocalPosts(localPosts);
    
    // Sync to Supabase
    if (supabaseClient) {
        updateSyncStatus('syncing');
        try {
            await supabaseClient.from('posts').insert(newPost);
            updateSyncStatus('synced');
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
        const reactions = await getReactions(post.id);
        Object.entries(reactions).forEach(([emoji, count]) => {
            const el = document.getElementById(`reaction-${post.id}-${emoji}`);
            if (el) el.textContent = count > 0 ? count : '';
        });
    }
}

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
            
            ${post.image ? `<div class="post-image"><img src="${post.image}" alt="Post image" loading="lazy"></div>` : ''}
            ${post.audio ? `<div class="post-audio"><audio controls src="${post.audio}"></audio></div>` : ''}
            
            <div class="post-footer">
                <div class="reactions-buttons">
                    ${['❤️', '👍', '😂', '🔥', '💭'].map(emoji => `
                        <button class="reaction-btn" data-post-id="${post.id}" data-reaction="${emoji}">
                            <span>${emoji}</span>
                            <span class="reaction-count" id="reaction-${post.id}-${emoji}"></span>
                        </button>
                    `).join('')}
                </div>
                <div class="share-actions">
                    <button class="share-btn" onclick="toggleShareMenu('${post.id}')" title="Share">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                    <div class="share-menu" id="share-menu-${post.id}">
                        <button onclick="shareToTwitter(\`${escapeForAttr(post.text)}\`)">Share on X</button>
                        <button onclick="copyToClipboard(\`${escapeForAttr(post.text)}\`)">Copy text</button>
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
    currentPostImage = null;
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
    
    if (submitBtn) submitBtn.disabled = !(hasText && hasMood);
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
// IMAGE UPLOAD
// ═══════════════════════════════════════════════════════════════
function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Please select an image');
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
        preview.innerHTML = `<img src="${src}" alt="Preview"><button type="button" class="remove-image" onclick="removeImage()">×</button>`;
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
        image: currentPostImage,
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
        
        if (draft.image) {
            currentPostImage = draft.image;
            showImagePreview(draft.image);
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
    document.querySelectorAll('.share-menu').forEach(menu => {
        if (menu.id !== `share-menu-${postId}`) menu.classList.remove('visible');
    });
    const menu = document.getElementById(`share-menu-${postId}`);
    if (menu) menu.classList.toggle('visible');
}

function shareToTwitter(text) {
    const truncated = text.length > 250 ? text.substring(0, 247) + '...' : text;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(truncated + '\n\n— from MoodRing')}`, '_blank');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'));
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
    
    document.getElementById('postForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedMood || !thoughtInput?.value.trim()) return;
        
        try {
            await createPost(thoughtInput.value, selectedMood, currentPostImage, currentPostAudio);
            closeModal();
            clearDraft();
            showToast('Post published!');
            await renderPosts();
            await updateCounts();
        } catch (err) {
            showToast('Failed to publish');
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
    
    // Reactions
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.reaction-btn');
        if (!btn) return;
        
        const postId = btn.dataset.postId;
        const reactionType = btn.dataset.reaction;
        if (!postId || !reactionType) return;
        
        btn.disabled = true;
        const added = await toggleReaction(postId, reactionType);
        btn.classList.toggle('active', added);
        
        const reactions = await getReactions(postId);
        Object.entries(reactions).forEach(([emoji, count]) => {
            const el = document.getElementById(`reaction-${postId}-${emoji}`);
            if (el) el.textContent = count > 0 ? count : '';
        });
        
        btn.disabled = false;
    });
    
    // Close share menus on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.share-btn') && !e.target.closest('.share-menu')) {
            document.querySelectorAll('.share-menu').forEach(m => m.classList.remove('visible'));
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
window.copyToClipboard = copyToClipboard;
window.removeImage = removeImage;
window.removeAudio = removeAudio;
window.handleImageUpload = handleImageUpload;
window.toggleVoice = toggleVoice;
window.toggleAudioRecording = toggleAudioRecording;
window.saveDraft = saveDraft;
window.restoreDraft = restoreDraft;

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
