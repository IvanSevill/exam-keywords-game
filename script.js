// Elements
const helpBtn = document.getElementById('helpBtn');
const langToggleBtn = document.getElementById('langToggleBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const tutorialModal = document.getElementById('tutorial-modal');
const closeTutorialBtn = document.getElementById('closeTutorialBtn');

const setupSection = document.getElementById('setup-section');
const difficultySelectorWrapper = document.getElementById('difficulty-selector-wrapper');
const startBtn = document.getElementById('startBtn');

const explorerSection = document.getElementById('explorer-section');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const explorerList = document.getElementById('explorer-list');

const gameSection = document.getElementById('game-section');
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
const fullAnswerContainer = document.getElementById('full-answer-container');
const fullAnswerText = document.getElementById('full-answer-text');
const exitTestBtn = document.getElementById('exitTestBtn');

// State
let allQuestions = [];
let currentQuestionIndex = 0;
let currentKeywords = [];
let foundKeywords = new Set();
let isAnswerShown = false;
let gameMode = 'normal'; // 'normal', 'learning', or 'hard'
let learningInterval = null;

// History & Score State
let sessionScore = 0;
let sessionTotal = 0;

// Theme Toggle
let isDarkMode = true;
themeToggleBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme');
        themeToggleBtn.textContent = '🌙';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggleBtn.textContent = '🌞';
    }
});

// --- I18N (Translations) ---
const translations = {
    en: {
        tut_title: "Welcome to Active Recall Game!",
        tut_p1: "This app helps you memorize your exam answers by forcing you to recall the keywords.",
        tut_modes_title: "Game Modes:",
        tut_mode_norm_title: "Normal:",
        tut_mode_norm_desc: "Type the full answer. The app will detect keywords as you type. No hints provided.",
        tut_mode_learn_title: "Learning:",
        tut_mode_learn_desc: "Fill-in-the-blanks mode. It reveals letters automatically every 3 seconds to help you memorize.",
        tut_mode_hard_title: "Fast (Hard):",
        tut_mode_hard_desc: "No text area. Just type the exact keywords in individual boxes.",
        tut_mode_explore_title: "Study Explorer:",
        tut_mode_explore_desc: "Browse all questions, answers and keywords before playing. Great for reviewing.",
        tut_btn: "Got it! Let's start",
        header_subtitle: "Practice your answers effectively.",
        status_searching: "Looking for data...",
        status_loaded: "Data loaded successfully",
        status_error: "❌ <b>Could not load data.</b><br><br>Make sure `data.js` exists and has the correct format.",
        diff_label: "Select difficulty:",
        diff_norm_title: "Normal",
        diff_norm_desc: "Full answer typing. No automated hints.",
        diff_learn_title: "Learning",
        diff_learn_desc: "Fill-in-the-blanks with automated hints over time.",
        diff_hard_title: "Fast (Hard)",
        diff_hard_desc: "Only write the exact keywords. No filler text.",
        start_btn: "Start",
        history_title: "Session History",
        history_empty: "No history yet. Complete your first test!",
        history_hits: "Hits",
        keywords_label: "Keywords:",
        answer_label: "Write your answer from memory:",
        answer_placeholder: "Start typing... you must use all keywords to proceed.",
        show_ans_btn: "Show Full Answer",
        next_btn_locked: "Next Question (Locked)",
        next_btn_unlocked: "Next Question",
        next_btn_finish: "Finish Test",
        full_ans_title: "Full Answer:",
        alert_finish: "Test finished! Score:",
        explore_title: "Study Explorer",
        explore_desc: "View all questions, answers, and keywords to study before playing.",
        back_menu_btn: "⬅ Back to Menu",
        explorer_title: "Study Explorer",
        hard_input_ph: "Type keyword and press Enter...",
        q_counter: "Question {current} of {total}",
        exit_test_btn: "Exit Test",
        confirm_exit: "Are you sure you want to end the current test early?",
        press_space: "✓ All found! Press Space for the next question"
    },
    tr: {
        tut_title: "Active Recall Oyununa Hoş Geldiniz!",
        tut_p1: "Bu uygulama, anahtar kelimeleri hatırlamanızı zorlayarak sınav cevaplarınızı ezberlemenize yardımcı olur.",
        tut_modes_title: "Oyun Modları:",
        tut_mode_norm_title: "Normal:",
        tut_mode_norm_desc: "Tam cevabı yazın. Siz yazarken uygulama anahtar kelimeleri tespit edecektir. İpucu verilmez.",
        tut_mode_learn_title: "Öğrenme:",
        tut_mode_learn_desc: "Boşluk doldurma modu. Ezberlemenize yardımcı olmak için her 3 saniyede bir harf otomatik gösterilir.",
        tut_mode_hard_title: "Hızlı (Zor):",
        tut_mode_hard_desc: "Metin alanı yok. Sadece bireysel kutulara tam anahtar kelimeleri yazın.",
        tut_mode_explore_title: "Çalışma Gezgini:",
        tut_mode_explore_desc: "Oynamadan önce tüm soruları, cevapları ve kelimeleri inceleyin. Tekrar için idealdir.",
        tut_btn: "Anladım! Başlayalım",
        header_subtitle: "Cevaplarınızı etkili bir şekilde pratik yapın.",
        status_searching: "Veri aranıyor...",
        status_loaded: "Veriler başarıyla yüklendi",
        status_error: "❌ <b>Veri yüklenemedi.</b><br><br>`data.js` dosyasının var olduğundan ve doğru biçime sahip olduğundan emin olun.",
        diff_label: "Zorluk seçin:",
        diff_norm_title: "Normal",
        diff_norm_desc: "Tam cevap yazma. Otomatik ipucu yok.",
        diff_learn_title: "Öğrenme",
        diff_learn_desc: "Zamanla otomatik ipuçları içeren boşluk doldurma modu.",
        diff_hard_title: "Hızlı (Zor)",
        diff_hard_desc: "Sadece tam anahtar kelimeleri yazın. Boş metin yok.",
        start_btn: "Başlat",
        history_title: "Oturum Geçmişi",
        history_empty: "Henüz geçmiş yok. İlk testinizi tamamlayın!",
        history_hits: "Doğru",
        keywords_label: "Anahtar Kelimeler:",
        answer_label: "Cevabınızı hafızadan yazın:",
        answer_placeholder: "Yazmaya başlayın... ilerlemek için tüm anahtar kelimeleri kullanmalısınız.",
        show_ans_btn: "Tam Cevabı Göster",
        next_btn_locked: "Sonraki Soru (Kilitli)",
        next_btn_unlocked: "Sonraki Soru",
        next_btn_finish: "Testi Bitir",
        full_ans_title: "Tam Cevap:",
        alert_finish: "Test bitti! Puan:",
        explore_title: "Çalışma Gezgini",
        explore_desc: "Oynamadan önce çalışmak için tüm soruları, cevapları ve kelimeleri görün.",
        back_menu_btn: "⬅ Menüye Dön",
        explorer_title: "Çalışma Gezgini",
        hard_input_ph: "Anahtar kelimeyi yazın ve Enter'a basın...",
        q_counter: "Soru {current} / {total}",
        exit_test_btn: "Testten Çık",
        confirm_exit: "Mevcut testi erken bitirmek istediğinize emin misiniz?",
        press_space: "✓ Hepsi bulundu! Sonraki soru için Boşluk tuşuna basın"
    }
};

let currentLang = localStorage.getItem('examLang') || 'en';

function updateLanguage() {
    langToggleBtn.textContent = currentLang === 'en' ? '🇹🇷' : '🇬🇧';
    const dict = translations[currentLang];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.innerHTML = dict[key];
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.placeholder = dict[key];
    });
    
    loadHistory(); // Re-render history for translation
}

langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'tr' : 'en';
    localStorage.setItem('examLang', currentLang);
    updateLanguage();
});

// --- TUTORIAL MODAL ---
function initTutorial() {
    const hasSeen = localStorage.getItem('tutorialSeen');
    if (!hasSeen) {
        tutorialModal.classList.remove('hidden');
    }
}

closeTutorialBtn.addEventListener('click', () => {
    tutorialModal.classList.add('hidden');
    localStorage.setItem('tutorialSeen', 'true');
});

helpBtn.addEventListener('click', () => {
    tutorialModal.classList.remove('hidden');
});

// Helper for shuffling array (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper to normalize strings
const normalizeString = (str) => {
    return str.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
              .trim()
              .replace(/[\s_]+/g, ''); // remove spaces
};

// Levenshtein Distance for spelling tolerance
function levenshtein(a, b) {
    if(a.length === 0) return b.length;
    if(b.length === 0) return a.length;
    var matrix = [];
    for(let i = 0; i <= b.length; i++){ matrix[i] = [i]; }
    for(let j = 0; j <= a.length; j++){ matrix[0][j] = j; }
    for(let i = 1; i <= b.length; i++){
        for(let j = 1; j <= a.length; j++){
            if(b.charAt(i-1) == a.charAt(j-1)){
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

function isMatchWithTolerance(userTextWithSpaces, kwOriginal) {
    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const kwNorm = norm(kwOriginal).trim();
    const userNorm = norm(userTextWithSpaces);
    const kwNoSpaces = kwNorm.replace(/[\s_]+/g, '');

    // Exact whole-word match using word boundary (prevents 'legal' matching 'illegal')
    const escaped = kwNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundaryRx = new RegExp(`(^|[\\s,;.!?])(${escaped})([\\s,;.!?]|$)`);
    if (wordBoundaryRx.test(userNorm)) return true;
    
    // Tolerance of approx ~15% errors, min 1
    const maxErrors = Math.max(1, Math.floor(kwNoSpaces.length * 0.15));
    
    const kwWords = kwNorm.split(/\s+/);
    const userWords = userNorm.split(/\s+/).filter(w => w.length > 0);
    
    if (kwWords.length === 1) {
        for (const w of userWords) {
            if (levenshtein(w, kwNoSpaces) <= maxErrors) return true;
        }
    } else {
        // Multi-word keyword: sliding window
        for (let i = 0; i <= userWords.length - kwWords.length; i++) {
            const windowText = userWords.slice(i, i + kwWords.length).join('');
            if (levenshtein(windowText, kwNoSpaces) <= maxErrors) return true;
        }
    }
    
    return false;
}

// --- HISTORY LOGIC ---
function loadHistory() {
    const historyContainer = document.getElementById('history-container');
    const history = JSON.parse(localStorage.getItem('examKeywordsHistory') || '[]');
    const dict = translations[currentLang];
    
    if (history.length === 0) {
        historyContainer.innerHTML = `<p class="status-text">${dict.history_empty}</p>`;
        return;
    }

    historyContainer.innerHTML = '';
    // Mostrar los últimos 10
    history.slice(0, 10).forEach(session => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const date = new Date(session.date).toLocaleString(currentLang === 'tr' ? 'tr-TR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' });
        
        item.innerHTML = `
            <div>
                <strong>${session.mode.toUpperCase()}</strong>
                <div class="history-meta">${date}</div>
            </div>
            <div class="history-score">${session.score}/${session.total} ${dict.history_hits}</div>
        `;
        historyContainer.appendChild(item);
    });
}

function saveHistory() {
    if (sessionTotal === 0) return; // Si no hay preguntas, no guardar
    const history = JSON.parse(localStorage.getItem('examKeywordsHistory') || '[]');
    history.unshift({
        date: new Date().toISOString(),
        mode: gameMode,
        score: sessionScore,
        total: sessionTotal
    });
    localStorage.setItem('examKeywordsHistory', JSON.stringify(history));
    loadHistory();
}

// Initial load
updateLanguage();
initTutorial();

// --- AUTO LOAD DATA ---
async function loadData() {
    const statusEl = document.getElementById('file-status');
    try {
        const response = await fetch('file.csv');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            delimiter: "|", // pipe-delimited (answers contain commas so auto-detect breaks)
            complete: function(results) {
                console.log(translations[currentLang].status_loaded);
                statusEl.classList.add('hidden'); // Hide status on success
                processData(results.data);
            }
        });
    } catch (err) {
        statusEl.innerHTML = translations[currentLang].status_error;
        statusEl.style.color = "var(--error)";
        console.error("Error loading data:", err);
    }
}

loadData();

function processData(data) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    let colPregunta = headers.find(h => normalizeString(h).includes('pregunta')) || headers[0];
    let colRespuesta = headers.find(h => normalizeString(h).includes('respuesta')) || headers[1];
    let colClaves = headers.find(h => normalizeString(h).includes('clave')) || headers[2];

    allQuestions = data.map(row => {
        let rawClaves = row[colClaves] || '';
        let enPart = rawClaves;
        let trPart = '';
        if (rawClaves.includes('@')) {
            const parts = rawClaves.split('@');
            enPart = parts[0];
            trPart = parts[1];
        }

        return {
            pregunta: row[colPregunta] || "",
            respuesta: row[colRespuesta] || "",
            claves: enPart.split('#').map(k => k.trim()).filter(k => k.length > 0),
            clavesTr: trPart.split('#').map(k => k.trim()).filter(k => k.length > 0)
        };
    }).filter(q => q.pregunta && q.claves.length > 0); // Ignore empty rows

    difficultySelectorWrapper.classList.remove('hidden');
}

// --- EXPLORER MODE ---
function launchExplorer() {
    setupSection.classList.add('hidden');
    explorerSection.classList.remove('hidden');
    
    explorerList.innerHTML = '';
    
    allQuestions.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'explorer-item fade-in';
        item.style.animationDelay = `${Math.min(idx * 0.05, 0.5)}s`;
        
        let formattedAnswer = q.respuesta;
        q.claves.forEach(kw => {
            const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
            formattedAnswer = formattedAnswer.replace(regex, '<span class="highlight-found">$1</span>');
        });

        item.innerHTML = `
            <h3>Q${idx + 1}: ${q.pregunta}</h3>
            <div class="ans">${formattedAnswer}</div>
            <div class="kw-list">
                ${q.claves.map((k, i) => {
                    const tr = q.clavesTr ? q.clavesTr[i] : '';
                    return `<span class="kw-badge">${k}${tr ? ` <span style="opacity:0.7; font-size:0.9em; margin-left:4px;">(${tr})</span>` : ''}</span>`;
                }).join('')}
            </div>
        `;
        explorerList.appendChild(item);
    });
}

backToMenuBtn.addEventListener('click', () => {
    explorerSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
});

startBtn.addEventListener('click', () => {
    // Get selected difficulty
    const diffRadios = document.getElementsByName('difficulty');
    for (const radio of diffRadios) {
        if (radio.checked) {
            gameMode = radio.value;
            break;
        }
    }

    if (gameMode === 'explore') {
        launchExplorer();
        return;
    }

    // Shuffle questions
    shuffleArray(allQuestions);
    currentQuestionIndex = 0;
    sessionScore = 0;
    sessionTotal = allQuestions.length;

    setupSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    
    const modeLabels = { normal: 'Normal', learning: translations[currentLang].diff_learn_title, hard: translations[currentLang].diff_hard_title };
    difficultyBadge.textContent = modeLabels[gameMode] || gameMode;
    
    loadQuestion();
});

// 2. Game Logic
function loadQuestion() {
    isAnswerShown = false;
    foundKeywords.clear();
    fullAnswerContainer.classList.add('hidden');
    hardModeInputContainer.classList.add('hidden');
    learningClozeContainer.classList.add('hidden');
    hardModeInput.disabled = false;
    hardModeInput.value = '';
    
    // Default show keywords panel
    document.querySelector('.keywords-panel').classList.remove('hidden');
    
    const q = allQuestions[currentQuestionIndex];
    currentKeywords = q.claves.map((k, idx) => ({
        id: idx,
        original: k,
        translation: q.clavesTr ? q.clavesTr[idx] : '',
        normalized: normalizeString(k)
    }));

    // Log keywords for debugging
    console.log(`[DEBUG] Keywords para la pregunta ${currentQuestionIndex + 1}:`, currentKeywords.map(k => k.original));

    // UI Updates
    const dict = translations[currentLang];
    const counterText = dict.q_counter.replace('{current}', currentQuestionIndex + 1).replace('{total}', allQuestions.length);
    questionCounter.textContent = counterText;
    questionText.textContent = q.pregunta;
    progressBar.style.width = `${((currentQuestionIndex) / allQuestions.length) * 100}%`;
    
    // Setup keywords UI
    keywordsTotalCount.textContent = currentKeywords.length;
    keywordsFoundCount.textContent = "0";
    keywordsContainer.innerHTML = '';
    
    // Clear learning interval if exists
    if (learningInterval) clearInterval(learningInterval);

    learningClozeContainer.classList.add('hidden');

    if (gameMode === 'normal' || gameMode === 'learning') {
        normalAnswerSection.classList.remove('hidden');
        userAnswerInput.value = '';
        
        // Both modes use Cloze (fill-in-the-blanks)
        document.querySelector('.keywords-panel').classList.add('hidden');
        learningClozeContainer.classList.remove('hidden');
        
        let clozeText = q.respuesta;
        currentKeywords.forEach(kw => {
            kw.revealedCount = 0; 
            const escapedKw = kw.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b(${escapedKw})\\b`, 'gi');
            
            const hiddenText = kw.original.replace(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '•');
            clozeText = clozeText.replace(regex, `<span class="cloze-blank" data-kw-id="${kw.id}">${hiddenText}</span>`);
        });
        learningClozeContainer.innerHTML = clozeText;

        if (gameMode === 'learning') {
            startLearningTimer();
        }
    } else {
        // Hard Mode: Single Input
        document.querySelector('.keywords-panel').classList.remove('hidden');
        normalAnswerSection.classList.add('hidden');
        hardModeInputContainer.classList.remove('hidden');
        hardModeInput.value = '';
        hardModeInput.focus();
        
        // Show hidden badges (so they can turn green when typed)
        currentKeywords.forEach((kw) => {
            const badge = document.createElement('div');
            badge.className = 'keyword-badge hidden-word';
            badge.id = `kw-${kw.id}`;
            badge.textContent = kw.original.replace(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '•');
            keywordsContainer.appendChild(badge);
        });
    }

    updateNextButtonState();
}

function startLearningTimer() {
    learningInterval = setInterval(() => {
        if (isAnswerShown) {
            clearInterval(learningInterval);
            return;
        }

        // Find unfound keywords that still have hidden letters (always keep last letter hidden)
        let pendingKws = currentKeywords.filter(kw => !foundKeywords.has(kw.id) && kw.revealedCount < kw.original.length - 1);
        
        if (pendingKws.length > 0) {
            // Pick random keyword
            let randomKw = pendingKws[Math.floor(Math.random() * pendingKws.length)];
            randomKw.revealedCount++;
            
            const badge = document.getElementById(`kw-${randomKw.id}`);
            const originalChars = randomKw.original.split('');
            
            // Build text: first N chars are real, rest are dots if they are letters
            const newText = originalChars.map((char, index) => {
                if (index < randomKw.revealedCount) return char;
                if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(char)) return '•';
                return char; // keep spaces or punctuation
            }).join('');
            
            if (badge) {
                badge.textContent = newText; // no translation while still hidden
            }
            
            const clozes = document.querySelectorAll(`[data-kw-id="${randomKw.id}"]`);
            clozes.forEach(cloze => { cloze.textContent = newText; });
        } else if (foundKeywords.size === currentKeywords.length) {
            clearInterval(learningInterval);
        }
    }, 3000); // 3 seconds
}

// 3. User Input checking
let inputDebounceTimer = null;

// Normal Mode (Textarea)
userAnswerInput.addEventListener('input', () => {
    if (isAnswerShown || (gameMode !== 'normal' && gameMode !== 'learning')) return;

    if (inputDebounceTimer) clearTimeout(inputDebounceTimer);
    
    inputDebounceTimer = setTimeout(() => {
        const textWithSpaces = userAnswerInput.value.trim(); 
        if (!textWithSpaces) return;

        let matchedKw = null;
        currentKeywords.forEach((kw) => {
            if (!foundKeywords.has(kw.id) && isMatchWithTolerance(textWithSpaces, kw.original)) {
                foundKeywords.add(kw.id);
                matchedKw = kw;
                
                const badge = document.getElementById(`kw-${kw.id}`);
                if (badge) badge.style.display = 'none';
                
                const clozes = document.querySelectorAll(`[data-kw-id="${kw.id}"]`);
                clozes.forEach(cloze => {
                    let inner = kw.original;
                    if (currentLang === 'tr' && kw.translation) {
                        inner += ` <span style="font-size:0.85em; opacity:0.8; font-family:sans-serif; letter-spacing:normal;">(${kw.translation})</span>`;
                    }
                    cloze.innerHTML = inner;
                    cloze.classList.add('found-cloze');
                });
                
                keywordsFoundCount.textContent = foundKeywords.size;
                updateNextButtonState();
            }
        });
        
        if (matchedKw) {
            userAnswerInput.value = '';
        }
    }, 450); // 450ms delay after typing stops
});

// Hard Mode (Single Input)
hardModeInput.addEventListener('keyup', (e) => {
    if (isAnswerShown) return;
    if (e.key === 'Enter') {
        const rawText = hardModeInput.value.trim();
        if (!rawText) return;
        
        // Check if it matches any unfound keyword
        let matchedKw = null;
        for (const kw of currentKeywords) {
            if (!foundKeywords.has(kw.id) && isMatchWithTolerance(rawText, kw.original)) {
                matchedKw = kw;
                break;
            }
        }
        
        if (matchedKw) {
            foundKeywords.add(matchedKw.id);
            
            // Visual feedback on input
            hardModeInput.classList.add('flash-success');
            setTimeout(() => hardModeInput.classList.remove('flash-success'), 300);
            hardModeInput.value = ''; // clear for next keyword
            
            // Disappear the badge completely
            const badge = document.getElementById(`kw-${matchedKw.id}`);
            if (badge) badge.style.display = 'none';
            
            const clozes = document.querySelectorAll(`[data-kw-id="${matchedKw.id}"]`);
            clozes.forEach(cloze => {
                let inner = matchedKw.original;
                if (currentLang === 'tr' && matchedKw.translation) {
                    inner += ` <span style="font-size:0.85em; opacity:0.8; font-family:sans-serif; letter-spacing:normal;">(${matchedKw.translation})</span>`;
                }
                cloze.innerHTML = inner;
                cloze.classList.add('found-cloze');
            });
            
            keywordsFoundCount.textContent = foundKeywords.size;
            updateNextButtonState();
        } else {
            // Optional: Shake effect on error
            hardModeInput.style.animation = 'none';
            hardModeInput.offsetHeight; /* trigger reflow */
            hardModeInput.style.animation = 'pulse 0.3s ease';
        }
    }
});

// 4. Buttons logic
showAnswerBtn.addEventListener('click', () => {
    isAnswerShown = true;
    if (learningInterval) clearInterval(learningInterval);
    const q = allQuestions[currentQuestionIndex];
    
    if (gameMode === 'normal' || gameMode === 'learning') {
        currentKeywords.forEach((kw) => {
            if (!foundKeywords.has(kw.id)) {
                const badge = document.getElementById(`kw-${kw.id}`);
                if (badge) {
                    badge.classList.remove('hidden-word');
                    let inner = kw.original;
                    if (currentLang === 'tr' && kw.translation) {
                        inner += ` <span style="font-size:0.85em; color:var(--text-main); font-family:sans-serif; letter-spacing:normal;">(${kw.translation})</span>`;
                    }
                    badge.innerHTML = inner;
                    badge.style.color = 'var(--error)';
                    badge.style.borderColor = 'var(--error)';
                }
                
                const cloze = document.getElementById(`cloze-kw-${kw.id}`);
                if (cloze) {
                    cloze.textContent = kw.original;
                    cloze.style.color = 'var(--error)';
                    cloze.style.borderBottomColor = 'var(--error)';
                }
            }
        });
    } else {
        // Hard mode: Reveal badges
        currentKeywords.forEach((kw) => {
            if (!foundKeywords.has(kw.id)) {
                const badge = document.getElementById(`kw-${kw.id}`);
                badge.classList.remove('hidden-word');
                let inner = kw.original;
                if (currentLang === 'tr' && kw.translation) {
                    inner += ` <span style="font-size:0.85em; color:var(--text-main); font-family:sans-serif; letter-spacing:normal;">(${kw.translation})</span>`;
                }
                badge.innerHTML = inner;
                badge.style.color = 'var(--error)';
                badge.style.borderColor = 'var(--error)';
            }
        });
        hardModeInput.disabled = true;
    }

    // Format the full answer highlighting all keywords
    let formattedAnswer = q.respuesta;
    currentKeywords.forEach(kw => {
        const escaped = kw.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
        formattedAnswer = formattedAnswer.replace(regex, '<span class="highlight-found">$1</span>');
    });

    fullAnswerText.innerHTML = formattedAnswer;
    fullAnswerContainer.classList.remove('hidden');
    
    fullAnswerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Unlock Next button if user gave up
    nextQuestionBtn.disabled = false;
    if (currentQuestionIndex === allQuestions.length - 1) {
        nextQuestionBtn.textContent = "Finalizar Test";
    }
});

function updateNextButtonState() {
    const allFound = foundKeywords.size === currentKeywords.length;
    const dict = translations[currentLang];
    
    if (allFound || isAnswerShown) {
        nextQuestionBtn.disabled = false;
        if (currentQuestionIndex === allQuestions.length - 1) {
            nextQuestionBtn.textContent = dict.next_btn_finish;
        } else {
            nextQuestionBtn.textContent = dict.next_btn_unlocked;
        }

        // Show space-to-continue banner if all found naturally (not via give-up)
        if (allFound && !isAnswerShown) {
            showSpaceBanner();
        }
    } else {
        nextQuestionBtn.disabled = true;
        nextQuestionBtn.textContent = dict.next_btn_locked;
    }
}

function finishTest() {
    alert(`${translations[currentLang].alert_finish} ${sessionScore} / ${sessionTotal}.`);
    saveHistory();
    setupSection.classList.remove('hidden');
    gameSection.classList.add('hidden');
    progressBar.style.width = '100%';
    setTimeout(() => progressBar.style.width = '0%', 500);
}

nextQuestionBtn.addEventListener('click', () => {
    // Si no usó "Mostrar respuesta", cuenta como acierto
    if (!isAnswerShown) {
        sessionScore++;
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        finishTest();
    }
});

exitTestBtn.addEventListener('click', () => {
    if (confirm(translations[currentLang].confirm_exit)) {
        if (learningInterval) clearInterval(learningInterval);
        finishTest();
    }
});

// --- SPACE TO CONTINUE ---
let waitingForSpace = false;

function showSpaceBanner() {
    waitingForSpace = true;
    const dict = translations[currentLang];

    // Hide the answer input area and the show-answer button
    normalAnswerSection.classList.add('hidden');
    hardModeInputContainer.classList.add('hidden');
    showAnswerBtn.classList.add('hidden');

    const existingBanner = document.getElementById('space-banner');
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.id = 'space-banner';
    banner.className = 'space-banner mt-4';
    banner.textContent = dict.press_space;
    
    // Insert before the actions group
    const actionsGroup = document.querySelector('.actions-group');
    actionsGroup.parentNode.insertBefore(banner, actionsGroup);
}

function hideBanner() {
    const banner = document.getElementById('space-banner');
    if (banner) banner.remove();
    showAnswerBtn.classList.remove('hidden');
    waitingForSpace = false;
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && waitingForSpace) {
        e.preventDefault();
        hideBanner();
        sessionScore++; // All found naturally = correct
        if (currentQuestionIndex < allQuestions.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
        } else {
            finishTest();
        }
    }
});
