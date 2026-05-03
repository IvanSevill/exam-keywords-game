// Global State
let currentLang = localStorage.getItem('gameLang') || 'en';
let theme = localStorage.getItem('gameTheme') || 'dark';

// Initial check
document.documentElement.setAttribute('data-theme', theme);

// Translations
function updateLanguageUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[currentLang][key];
            } else {
                el.innerHTML = translations[currentLang][key];
            }
        }
    });
    
    // Update language toggle button text/icon
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) langBtn.textContent = currentLang === 'en' ? '🇹🇷' : '🇬🇧';
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'tr' : 'en';
    localStorage.setItem('gameLang', currentLang);
    updateLanguageUI();
    // Refresh page if needed or re-render components
    if (window.location.pathname.includes('explorer.html') || window.location.pathname.includes('game.html')) {
        location.reload();
    }
}

// Theme
function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gameTheme', theme);
    document.documentElement.setAttribute('data-theme', theme);
}

// Utility: Match word with spelling tolerance (85%)
function isMatchWithTolerance(typed, target) {
    if (!typed || !target) return false;
    const s1 = typed.toLowerCase().trim();
    const s2 = target.toLowerCase().trim();
    
    if (s1 === s2) return true;
    
    const distance = levenshtein(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = 1 - (distance / maxLength);
    
    return similarity >= 0.85;
}

function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// Data Loading
async function loadCSVData() {
    return new Promise((resolve, reject) => {
        // Cache busting: add unique timestamp to URL
        const url = 'file.csv?v=' + new Date().getTime();
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            delimiter: "|",
            transformHeader: h => h.trim(),
            transform: v => v.trim(),
            complete: (results) => {
                console.log("CSV Parsed:", results.data.length, "rows");
                resolve(results.data);
            },
            error: (err) => {
                console.error("PapaParse Error:", err);
                reject(err);
            }
        });
    });
}

// History
function saveToHistory(mode, score, total) {
    const history = JSON.parse(localStorage.getItem('examGameHistory') || '[]');
    history.unshift({
        date: new Date().toLocaleString(),
        mode,
        score,
        total
    });
    localStorage.setItem('examGameHistory', JSON.stringify(history.slice(0, 10)));
}

function loadHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;
    
    const history = JSON.parse(localStorage.getItem('examGameHistory') || '[]');
    if (history.length === 0) {
        container.innerHTML = `<p class="text-center py-4" data-i18n="no_history">No recent sessions.</p>`;
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="history-item fade-in">
            <div>
                <span class="badge badge-${item.mode}">${item.mode.toUpperCase()}</span>
                <small class="block mt-1 text-muted">${item.date}</small>
            </div>
            <div class="text-xl font-bold">${item.score}/${item.total}</div>
        </div>
    `).join('');
}

// Common Formatter
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

// Global Event Listeners (if elements exist)
document.addEventListener('DOMContentLoaded', () => {
    updateLanguageUI();
    const lBtn = document.getElementById('langToggleBtn');
    if (lBtn) lBtn.onclick = toggleLanguage;
    
    const tBtn = document.getElementById('themeToggleBtn');
    if (tBtn) tBtn.onclick = toggleTheme;
});
