// Game Specific Logic
const progressBar = document.getElementById('progress-bar');
const difficultyBadge = document.getElementById('difficulty-badge');
const questionCounter = document.getElementById('question-counter');
const questionText = document.getElementById('question-text');
const keywordsContainer = document.getElementById('keywords-container');
const keywordsFoundCount = document.getElementById('keywords-found-count');
const keywordsTotalCount = document.getElementById('keywords-total-count');
const normalAnswerSection = document.getElementById('normal-answer-section');
const userAnswerInput = document.getElementById('user-answer');
const learningClozeContainer = document.getElementById('learning-cloze-container');
const hardModeInputContainer = document.getElementById('hard-mode-input-container');
const hardModeInput = document.getElementById('hard-mode-input');
const showAnswerBtn = document.getElementById('showAnswerBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const exitTestBtn = document.getElementById('exitTestBtn');

let allQuestions = [];
let currentQuestionIndex = 0;
let currentKeywords = [];
let foundKeywords = new Set();
let isAnswerShown = false;
let gameMode = 'normal';
let learningInterval = null;
let sessionScore = 0;
let sessionTotal = 0;
let waitingForSpace = false;
let pendingKeywords = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        gameMode = params.get('mode') || 'normal';
        
        const data = await loadCSVData();
        if (!data || data.length === 0) {
            alert("No data found. Returning to menu.");
            window.location.href = 'index.html';
            return;
        }

        processGameData(data);
        
        if (allQuestions.length > 0) {
            sessionTotal = allQuestions.length;
            loadQuestion();
        } else {
            alert("Questions could not be parsed. Check CSV format.");
            window.location.href = 'index.html';
        }
        
        setupEventListeners();
    } catch (err) {
        console.error("Game init failed:", err);
        alert("Error starting game: " + err.message);
    }
});

function processGameData(data) {
    allQuestions = data.map(row => {
        const rawClaves = row.highlights || '';
        const parts = rawClaves.split('@');
        return {
            pregunta: row.question || "",
            respuesta: row.full_answer || "",
            claves: (parts[0] || '').split('#').map(k => k.trim()).filter(k => k),
            clavesTr: (parts[1] || '').split('#').map(k => k.trim()).filter(k => k)
        };
    }).filter(q => q.pregunta && q.claves.length > 0);
}

function loadQuestion() {
    isAnswerShown = false;
    waitingForSpace = false;
    foundKeywords.clear();
    
    if (learningInterval) clearInterval(learningInterval);
    
    const existingBanner = document.getElementById('space-banner');
    if (existingBanner) existingBanner.remove();

    learningClozeContainer.classList.remove('full-reveal');
    learningClozeContainer.classList.add('hidden');
    
    document.querySelector('.keywords-panel').classList.remove('hidden');
    normalAnswerSection.classList.add('hidden');
    hardModeInputContainer.classList.add('hidden');
    
    showAnswerBtn.classList.remove('hidden');
    nextQuestionBtn.classList.remove('hidden');
    nextQuestionBtn.disabled = true;

    hardModeInput.disabled = false;
    hardModeInput.value = '';
    userAnswerInput.disabled = false;
    userAnswerInput.value = '';

    const q = allQuestions[currentQuestionIndex];
    currentKeywords = q.claves.map((k, idx) => ({
        id: idx,
        original: k,
        translation: q.clavesTr ? q.clavesTr[idx] : '',
        revealedCount: 0
    }));

    questionText.textContent = q.pregunta;
    updateQuestionCounter();
    updateProgressBar();
    renderKeywords();
    
    difficultyBadge.textContent = gameMode.toUpperCase();
    difficultyBadge.className = `badge badge-${gameMode}`;

    console.log("DEBUG - Keywords:", currentKeywords.map(k => k.original));

    if (gameMode === 'hard') {
        hardModeInputContainer.classList.remove('hidden');
        hardModeInput.focus();
    } else {
        normalAnswerSection.classList.remove('hidden');
        userAnswerInput.focus();
        if (gameMode === 'learning') {
            startLearningMode();
        }
    }
    
    renderClozeText();
    learningClozeContainer.classList.remove('hidden');
}

function renderKeywords() {
    keywordsContainer.innerHTML = '';
    currentKeywords.forEach(kw => {
        const span = document.createElement('span');
        span.id = `kw-${kw.id}`;
        span.className = 'keyword-badge';
        span.textContent = '•'.repeat(kw.original.length);
        keywordsContainer.appendChild(span);
    });
    updateKeywordsCount();
}

function renderClozeText() {
    const q = allQuestions[currentQuestionIndex];
    let text = q.respuesta;
    
    // 1. Replace keywords with safe placeholders (no '=' to avoid breaking formatMarkdown)
    currentKeywords.forEach(kw => {
        const escaped = kw.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
        text = text.replace(regex, `@@KW${kw.id}@@`);
    });

    // 2. Format structure (paragraphs, lists)
    let html = formatMarkdown(text);

    // 3. Replace placeholders with actual span tags
    currentKeywords.forEach(kw => {
        const placeholder = `@@KW${kw.id}@@`;
        let innerText = kw.original;
        
        // If showing full answer, add translation
        if (isAnswerShown && kw.translation) {
            innerText += ` (${kw.translation})`;
        }

        const span = `<span class="cloze-blank ${isAnswerShown ? 'found-cloze' : ''}" data-kw-id="${kw.id}">${innerText}</span>`;
        html = html.split(placeholder).join(span);
    });

    learningClozeContainer.innerHTML = html;
    
    // Hide initially (only if not showing full answer)
    if (!isAnswerShown) {
        document.querySelectorAll('.cloze-blank').forEach(el => {
            const id = el.getAttribute('data-kw-id');
            const kw = currentKeywords.find(k => k.id == id);
            el.textContent = '•'.repeat(kw.original.length);
        });
    }
}

function updateKeywordsCount() {
    keywordsFoundCount.textContent = foundKeywords.size;
    keywordsTotalCount.textContent = currentKeywords.length;
}

function updateQuestionCounter() {
    const dict = translations[currentLang];
    questionCounter.textContent = dict.q_counter.replace('{current}', currentQuestionIndex + 1).replace('{total}', allQuestions.length);
}

function updateProgressBar() {
    const pct = ((currentQuestionIndex) / allQuestions.length) * 100;
    progressBar.style.width = `${pct}%`;
}

function startLearningMode() {
    learningInterval = setInterval(() => {
        if (isAnswerShown || waitingForSpace) return;
        let pending = currentKeywords.filter(kw => !foundKeywords.has(kw.id) && kw.revealedCount < kw.original.length - 1);
        if (pending.length > 0) {
            let kw = pending[Math.floor(Math.random() * pending.length)];
            kw.revealedCount++;
            const newText = kw.original.split('').map((c, i) => i < kw.revealedCount ? c : (/[a-zA-Z]/.test(c) ? '•' : c)).join('');
            const badge = document.getElementById(`kw-${kw.id}`);
            if (badge) badge.textContent = newText;
            document.querySelectorAll(`[data-kw-id="${kw.id}"]`).forEach(el => el.textContent = newText);
        }
    }, 3000);
}

function checkAllFound() {
    if (foundKeywords.size === currentKeywords.length) {
        if (learningInterval) clearInterval(learningInterval);
        updateNextButtonState(true);
    }
}

function updateNextButtonState(allFound) {
    const dict = translations[currentLang];
    if (allFound || isAnswerShown) {
        nextQuestionBtn.disabled = false;
        showAnswerBtn.classList.add('hidden');
        nextQuestionBtn.classList.remove('hidden'); // Keep it visible!
        
        userAnswerInput.disabled = true;
        hardModeInput.disabled = true;
        document.querySelector('.keywords-panel').classList.add('hidden');

        nextQuestionBtn.textContent = currentQuestionIndex === allQuestions.length - 1 ? dict.next_btn_finish : dict.next_btn_unlocked;

        if (allFound && !isAnswerShown) showSpaceBanner();
    } else {
        nextQuestionBtn.disabled = true;
        nextQuestionBtn.classList.remove('hidden');
        nextQuestionBtn.textContent = dict.next_btn_locked;
        showAnswerBtn.classList.remove('hidden');
    }
}

function showSpaceBanner() {
    waitingForSpace = true;
    const banner = document.createElement('div');
    banner.id = 'space-banner';
    banner.className = 'space-banner mt-4';
    banner.textContent = translations[currentLang].press_space;
    learningClozeContainer.appendChild(banner);
}

function setupEventListeners() {
    userAnswerInput.addEventListener('input', () => {
        if (isAnswerShown) return;
        const val = userAnswerInput.value.trim();
        currentKeywords.forEach(kw => {
            if (!foundKeywords.has(kw.id) && !pendingKeywords.has(kw.id) && isMatchWithTolerance(val, kw.original)) {
                pendingKeywords.add(kw.id);
                // Wait 1 second before revealing and clearing
                setTimeout(() => {
                    revealKeyword(kw);
                    pendingKeywords.delete(kw.id);
                    userAnswerInput.value = ''; // Clear input
                }, 1000);
            }
        });
    });

    hardModeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const val = hardModeInput.value.trim();
            currentKeywords.forEach(kw => {
                if (!foundKeywords.has(kw.id) && !pendingKeywords.has(kw.id) && isMatchWithTolerance(val, kw.original)) {
                    pendingKeywords.add(kw.id);
                    setTimeout(() => {
                        revealKeyword(kw);
                        pendingKeywords.delete(kw.id);
                        hardModeInput.value = ''; // Clear input
                    }, 1000);
                }
            });
        }
    });

    showAnswerBtn.onclick = () => {
        isAnswerShown = true;
        if (learningInterval) clearInterval(learningInterval);
        renderClozeText(); // Re-render with highlights and translations
        learningClozeContainer.classList.add('full-reveal');
        updateNextButtonState(false);
    };

    nextQuestionBtn.onclick = handleNext;
    exitTestBtn.onclick = () => {
        if (confirm(translations[currentLang].confirm_exit)) window.location.href = 'index.html';
    };

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && waitingForSpace) {
            e.preventDefault();
            handleNext();
        }
    });
}

function revealKeyword(kw) {
    foundKeywords.add(kw.id);
    const badge = document.getElementById(`kw-${kw.id}`);
    if (badge) badge.style.display = 'none';
    
    document.querySelectorAll(`[data-kw-id="${kw.id}"]`).forEach(el => {
        let inner = kw.original;
        if (kw.translation) inner += ` (${kw.translation})`;
        el.innerHTML = inner;
        el.classList.add('found-cloze');
    });
    updateKeywordsCount();
    checkAllFound();
}

function handleNext() {
    if (!isAnswerShown) sessionScore++;
    if (currentQuestionIndex < allQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        saveToHistory(gameMode, sessionScore, sessionTotal);
        alert(`${translations[currentLang].alert_finish} ${sessionScore}/${sessionTotal}`);
        window.location.href = 'index.html';
    }
}
