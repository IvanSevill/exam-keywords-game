// Shared state and helpers
let currentLang = localStorage.getItem('examLang') || 'en';
let isDarkMode = localStorage.getItem('examTheme') !== 'light';

function updateThemeUI() {
    if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('examTheme', isDarkMode ? 'dark' : 'light');
    updateThemeUI();
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = isDarkMode ? '🌙' : '🌞';
}

function updateLanguageUI() {
    const btn = document.getElementById('langToggleBtn');
    if (btn) btn.textContent = currentLang === 'en' ? '🇹🇷' : '🇬🇧';
    
    const dict = translations[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.innerHTML = dict[key];
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.placeholder = dict[key];
    });
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'tr' : 'en';
    localStorage.setItem('examLang', currentLang);
    updateLanguageUI();
    if (typeof loadHistory === 'function') loadHistory();
}

// Formatting helpers
function formatMarkdown(text) {
    if (!text) return "";
    return text.split('$').map(section => {
        if (section.includes('=')) {
            const parts = section.split(/(=+)/);
            let html = '';
            let header = parts[0].trim();
            if (header) html += `<p>${header}</p>`;
            
            let currentLevel = 0;
            for (let i = 1; i < parts.length; i += 2) {
                const delim = parts[i];
                const content = (parts[i+1] || "").trim();
                if (!content) continue;
                
                const level = delim.length;
                
                if (level > currentLevel) {
                    while (currentLevel < level) {
                        html += '<ul class="ans-list">';
                        currentLevel++;
                    }
                } else if (level < currentLevel) {
                    while (currentLevel > level) {
                        html += '</ul>';
                        currentLevel--;
                    }
                }
                html += `<li>${content}</li>`;
            }
            while (currentLevel > 0) {
                html += '</ul>';
                currentLevel--;
            }
            return html;
        } else {
            return `<p>${section.trim()}</p>`;
        }
    }).join('');
}

// Data Loading
async function loadCSVData() {
    try {
        const response = await fetch('file.csv');
        const csvText = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                delimiter: "|",
                transformHeader: h => h.trim(),
                transform: v => v.trim(),
                complete: (results) => {
                    console.log("CSV Parsed:", results.data);
                    resolve(results.data);
                },
                error: (err) => {
                    console.error("PapaParse Error:", err);
                    reject(err);
                }
            });
        });
    } catch (err) {
        console.error("Error loading CSV:", err);
        return [];
    }
}

// History
function loadHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;
    const history = JSON.parse(localStorage.getItem('examKeywordsHistory') || '[]');
    const dict = translations[currentLang];
    
    if (history.length === 0) {
        container.innerHTML = `<p class="status-text" style="text-align:center; padding: 2rem; opacity:0.6;">${dict.history_empty}</p>`;
        return;
    }

    container.innerHTML = history.slice(0, 10).map(session => {
        const date = new Date(session.date).toLocaleString(currentLang === 'tr' ? 'tr-TR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' });
        return `
            <div class="history-item">
                <div>
                    <strong>${session.mode.toUpperCase()}</strong>
                    <div style="font-size:0.8rem; opacity:0.6;">${date}</div>
                </div>
                <div style="font-weight:700; color:var(--accent);">${session.score}/${session.total} ${dict.history_hits}</div>
            </div>
        `;
    }).join('');
}

function saveToHistory(mode, score, total) {
    if (total === 0) return;
    const history = JSON.parse(localStorage.getItem('examKeywordsHistory') || '[]');
    history.unshift({ date: new Date().toISOString(), mode, score, total });
    localStorage.setItem('examKeywordsHistory', JSON.stringify(history));
}

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

    const escaped = kwNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundaryRx = new RegExp(`(^|[\\s,;.!?])(${escaped})([\\s,;.!?]|$)`);
    if (wordBoundaryRx.test(userNorm)) return true;
    
    const maxErrors = Math.max(1, Math.floor(kwNoSpaces.length * 0.15));
    const kwWords = kwNorm.split(/\s+/);
    const userWords = userNorm.split(/\s+/).filter(w => w.length > 0);
    
    if (kwWords.length === 1) {
        for (const w of userWords) {
            if (levenshtein(w, kwNoSpaces) <= maxErrors) return true;
        }
    } else {
        for (let i = 0; i <= userWords.length - kwWords.length; i++) {
            const windowText = userWords.slice(i, i + kwWords.length).join('');
            if (levenshtein(windowText, kwNoSpaces) <= maxErrors) return true;
        }
    }
    return false;
}

// Init Globals
document.addEventListener('DOMContentLoaded', () => {
    updateThemeUI();
    updateLanguageUI();
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.onclick = toggleTheme;
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) langBtn.onclick = toggleLanguage;
});

