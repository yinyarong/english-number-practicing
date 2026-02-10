// State
const state = {
    currentAnswer: '',
    currentDisplay: '', // Sometimes display differs from speakable answer (e.g. dates)
    userInput: '',
    stats: {
        total: 0,
        correct: 0
    },
    settings: {
        language: 'en-US',
        theme: 'default', // Default theme
        modes: ['number', 'date', 'time', 'year'], // default active
        voice: null,
        autoSubmit: true
    },
    isSpeaking: false,
    currentMode: 'number',
    history: [] // Practice history
};

// Mode names in Chinese
const modeNames = {
    'number': '数字',
    'long-number': '长数字',
    'phone-11': '手机号',
    'phone-8': '电话号',
    'date': '日期',
    'time': '时间',
    'year': '年份'
};

// DOM Elements
const els = {
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    iconSun: document.getElementById('icon-sun'),
    iconMoon: document.getElementById('icon-moon'),
    historyBtn: document.getElementById('history-btn'),
    historyModal: document.getElementById('history-modal'),
    historyCloseBtn: document.getElementById('history-close-btn'),
    historyClearBtn: document.getElementById('history-clear-btn'),
    historyList: document.getElementById('history-list'),
    languageSelect: document.getElementById('language-select'),
    voiceSelect: document.getElementById('voice-select'),
    modesContainer: document.getElementById('modes-container'),
    autoSubmit: document.getElementById('auto-submit'),
    
    statTotal: document.getElementById('stat-total'),
    statCorrect: document.getElementById('stat-correct'),
    statAccuracy: document.getElementById('stat-accuracy'),
    
    userInput: document.getElementById('user-input'),
    inputHint: document.getElementById('input-hint'),
    messageArea: document.getElementById('message-area'),
    playIcon: document.getElementById('play-icon'),
    keys: document.querySelectorAll('.key')
};

// Utils for number to words (used in year pronunciation)
function numberToWords(num) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
                  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
                  'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    if (num < 20) return ones[num];
    if (num < 100) {
        const ten = Math.floor(num / 10);
        const one = num % 10;
        return tens[ten] + (one ? '-' + ones[one] : '');
    }
    return num.toString();
}

function numberToWordsUnder100(num) {
    if (num === 0) return '';
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
                  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
                  'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    if (num < 20) return ones[num];
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one ? '-' + ones[one] : '');
}

// Convert large numbers to English words with thousand, million, billion
function numberToLongWords(num) {
    if (num === 0) return 'zero';

    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
                  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
                  'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function convertUnderThousand(n) {
        if (n === 0) return '';
        if (n < 20) return ones[n];
        if (n < 100) {
            const t = Math.floor(n / 10);
            const o = n % 10;
            return tens[t] + (o ? '-' + ones[o] : '');
        }
        const h = Math.floor(n / 100);
        const rest = n % 100;
        return ones[h] + ' hundred' + (rest ? ' ' + convertUnderThousand(rest) : '');
    }

    const scales = [
        { value: 1000000000000, name: 'trillion' },
        { value: 1000000000, name: 'billion' },
        { value: 1000000, name: 'million' },
        { value: 1000, name: 'thousand' },
        { value: 1, name: '' }
    ];

    let result = '';
    let remaining = num;

    for (const scale of scales) {
        if (remaining >= scale.value) {
            const chunk = Math.floor(remaining / scale.value);
            const chunkWords = convertUnderThousand(chunk);
            if (chunkWords) {
                if (result) result += ' ';
                result += chunkWords;
                if (scale.name) result += ' ' + scale.name;
            }
            remaining %= scale.value;
        }
    }

    return result;
}

// Generators
const generators = {
    'number': () => {
        const n = Math.floor(Math.random() * 10000); // 0 - 9999
        return { speak: n.toString(), display: n.toString(), answer: n.toString() };
    },
    'long-number': () => {
        // Generate a number that may include thousands, millions, or billions
        const magnitude = Math.random();
        let n;

        if (magnitude < 0.33) {
            // Thousands: 1,000 - 999,999
            n = Math.floor(Math.random() * 998999) + 1000;
        } else if (magnitude < 0.66) {
            // Millions: 1,000,000 - 999,999,999
            n = Math.floor(Math.random() * 998999999) + 1000000;
        } else {
            // Billions: 1,000,000,000 - 999,999,999,999
            n = Math.floor(Math.random() * 998999999000) + 1000000000;
        }

        const display = n.toLocaleString();
        const speak = numberToLongWords(n);
        const answer = n.toLocaleString().replace(/,/g, '');

        return { speak: speak, display: display, answer: answer };
    },
    'phone-11': () => {
        // China style 1xx xxxx xxxx
        const prefix = ['13', '15', '18', '17'][Math.floor(Math.random() * 4)];
        const suffix = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
        const num = prefix + suffix;
        const speak = num.split('').join(' '); 
        return { speak: speak, display: num, answer: num };
    },
    'phone-8': () => {
        const n = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        const speak = n.split('').join(' ');
        return { speak: speak, display: n, answer: n };
    },
    'year': () => {
        const y = Math.floor(Math.random() * (2030 - 1900) + 1900);
        const display = y.toString();
        let speak = '';

        // 英语年份读法：两个数字、两个数字一组
        if (y >= 2000 && y <= 2009) {
            // 2000-2009: "two thousand (and) x"
            const lastTwo = y % 100;
            speak = lastTwo === 0 ? 'two thousand' : `two thousand ${lastTwo}`;
        } else if (y >= 2010 && y <= 2019) {
            // 2010-2019: "twenty ten", "twenty eleven", etc.
            const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
                          'sixteen', 'seventeen', 'eighteen', 'nineteen'];
            speak = `twenty ${teens[y - 2010]}`;
        } else if (y >= 2020 && y <= 2099) {
            // 2020-2099: "twenty twenty", "twenty twenty-one", etc.
            const hundreds = Math.floor(y / 100);
            const lastTwo = y % 100;
            const hundredsSpeak = numberToWords(hundreds);
            const lastTwoSpeak = numberToWordsUnder100(lastTwo);
            speak = `${hundredsSpeak} ${lastTwoSpeak}`;
        } else {
            // 1900-1999: "nineteen xx"
            const hundreds = Math.floor(y / 100);
            const lastTwo = y % 100;
            const hundredsSpeak = numberToWords(hundreds);
            const lastTwoSpeak = numberToWordsUnder100(lastTwo);
            speak = `${hundredsSpeak} ${lastTwoSpeak}`;
        }

        return { speak: speak, display: display, answer: display };
    },
    'time': () => {
        const h = Math.floor(Math.random() * 24);
        const m = Math.floor(Math.random() * 60);
        const hStr = h.toString().padStart(2, '0');
        const mStr = m.toString().padStart(2, '0');
        const answer = `${hStr}${mStr}`;

        // Three pronunciation modes
        const mode = Math.floor(Math.random() * 3);
        let speak = '';

        if (mode === 0) {
            // Mode 1: Direct reading (e.g., "three fifteen", "three oh five")
            speak = `${h} ${m}`;
            if (m < 10) speak = `${h} oh ${m}`;
            if (m === 0) speak = `${h} o'clock`;
        } else if (mode === 1) {
            // Mode 2: past/after (e.g., "fifteen past three", "half past three")
            if (m === 0) {
                speak = `${h} o'clock`;
            } else if (m === 15) {
                speak = `quarter past ${h}`;
            } else if (m === 30) {
                speak = `half past ${h}`;
            } else if (m < 30) {
                const minWords = numberToWordsUnder100(m);
                speak = `${minWords} past ${h}`;
            } else {
                // Fall back to direct reading for times > 30 minutes
                speak = `${h} ${m}`;
            }
        } else {
            // Mode 3: to/till/before (e.g., "fifteen to four", "quarter to four")
            if (m === 0) {
                speak = `${h} o'clock`;
            } else if (m === 45) {
                const nextH = (h + 1) % 24;
                speak = `quarter to ${nextH}`;
            } else if (m === 30) {
                speak = `half past ${h}`;
            } else if (m > 30) {
                const nextH = (h + 1) % 24;
                const remaining = 60 - m;
                const minWords = numberToWordsUnder100(remaining);
                // Randomly use to, till, or before
                const conjunction = ['to', 'till', 'before'][Math.floor(Math.random() * 3)];
                speak = `${minWords} ${conjunction} ${nextH}`;
            } else {
                // Fall back to direct reading for times <= 30 minutes
                speak = `${h} ${m}`;
            }
        }

        return { speak: speak, display: `${hStr}:${mStr}`, answer: answer };
    },
    'date': () => {
        const y = Math.floor(Math.random() * (2025 - 2000) + 2000);
        const m = Math.floor(Math.random() * 12) + 1;
        const d = Math.floor(Math.random() * 28) + 1;
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        const suffix = (d) => {
            if (d > 3 && d < 21) return 'th';
            switch (d % 10) {
                case 1: return "st";
                case 2: return "nd";
                case 3: return "rd";
                default: return "th";
            }
        };
        
        const speak = `${months[m-1]} ${d}${suffix(d)} ${y}`;
        const mStr = m.toString().padStart(2, '0');
        const dStr = d.toString().padStart(2, '0');
        return { speak: speak, display: `${y}-${mStr}-${dStr}`, answer: `${y}${mStr}${dStr}` };
    }
};

// Utils
function updateStats() {
    els.statTotal.textContent = state.stats.total;
    els.statCorrect.textContent = state.stats.correct;
    const acc = state.stats.total === 0 ? 0 : (state.stats.correct / state.stats.total * 100);
    els.statAccuracy.textContent = acc.toFixed(1) + '%';
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop previous
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = state.settings.language;
        
        if (state.settings.voice) {
            utterance.voice = state.settings.voice;
        } else {
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v => v.lang === state.settings.language && !v.localService) || 
                              voices.find(v => v.lang === state.settings.language);
            if (preferred) utterance.voice = preferred;
        }
        
        utterance.volume = 1.0; 
        utterance.rate = 0.9; 
        
        state.isSpeaking = true;
        els.playIcon.style.opacity = 0.5;
        
        utterance.onend = () => {
            state.isSpeaking = false;
            els.playIcon.style.opacity = 1;
        };
        
        utterance.onerror = (e) => {
            console.error("Speech error:", e);
            state.isSpeaking = false;
            els.playIcon.style.opacity = 1;
        };
        
        window.speechSynthesis.speak(utterance);
    } else {
        alert("您的浏览器不支持文字转语音功能 (TTS)。");
    }
}

// Mobile Audio Unlock
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;
    const u = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(u);
    audioUnlocked = true;
}
document.body.addEventListener('click', unlockAudio, { once: true });
document.body.addEventListener('touchstart', unlockAudio, { once: true });

function updateHint() {
    const mode = state.currentMode || 'number';
    let hintHTML = "";
    switch(mode) {
        case 'number': 
            hintHTML = "<span>数字 (0-9999)</span>"; 
            break;
        case 'long-number': 
            hintHTML = "<span>长数字</span>"; 
            break;
        case 'phone-11': 
            hintHTML = "<span>手机号 (11位)</span>"; 
            break;
        case 'phone-8': 
            hintHTML = "<span>电话号 (8位)</span>"; 
            break;
        case 'year': 
            hintHTML = "<span>年份 (YYYY)</span>"; 
            break;
        case 'time': 
            hintHTML = "<span>时</span> <span style='opacity:0.3'>:</span> <span>分</span>"; 
            break;
        case 'date': 
            hintHTML = "<span>年</span> <span style='opacity:0.3'>/</span> <span>月</span> <span style='opacity:0.3'>/</span> <span>日</span>"; 
            break;
        default:
            hintHTML = "<span>数字</span>";
    }
    
    if (els.inputHint) {
        els.inputHint.innerHTML = hintHTML;
        els.inputHint.style.display = 'flex'; // Ensure visible
        els.inputHint.style.opacity = '1';
    }
}

function nextQuestion() {
    // 1. Pick a mode
    const availableModes = state.settings.modes;
    if (availableModes.length === 0) {
        alert("请至少选择一种模式!");
        return;
    }
    const mode = availableModes[Math.floor(Math.random() * availableModes.length)];
    state.currentMode = mode;
    
    // 2. Generate
    const gen = generators[mode]();
    state.currentAnswer = gen.answer;
    state.currentDisplay = gen.display;
    state.currentSpeak = gen.speak; // Store!
    state.userInput = '';
    
    // 3. UI Reset
    // IMPORTANT: Call updateHint BEFORE renderInput or just ensure it is called
    updateHint(); // Explicitly call updateHint
    renderInput();
    
    els.messageArea.textContent = '';
    els.messageArea.className = 'message hidden';
    
    // 4. Speak
    speak(gen.speak);
    console.log("Target:", gen.answer);
}

function renderInput() {
    els.userInput.innerHTML = '';

    if (!state.currentAnswer) {
        return;
    }

    // number/long-number use comma format, time uses colon format
    const useCommaFormat = ['number', 'long-number'].includes(state.currentMode);
    const useColonFormat = state.currentMode === 'time';

    if (useCommaFormat) {
        // Comma format for numbers: 1,234,567
        const answerNum = parseInt(state.currentAnswer);
        const formatted = answerNum.toLocaleString();
        const inputLen = state.userInput.length;
        let digitCount = 0;

        for (let i = 0; i < formatted.length; i++) {
            const span = document.createElement('span');
            if (formatted[i] === ',') {
                span.textContent = ',';
                span.style.color = 'var(--text-color)';
                span.style.margin = '0 1px';
            } else if (digitCount < inputLen) {
                span.textContent = state.userInput[digitCount];
                digitCount++;
            } else {
                span.textContent = '_';
                span.style.color = 'var(--placeholder-color)';
                span.style.margin = '0 1px';
            }
            els.userInput.appendChild(span);
        }
    } else if (useColonFormat) {
        // Colon format for time: 03:15
        const h = state.currentAnswer.substring(0, 2);
        const m = state.currentAnswer.substring(2, 4);
        const inputLen = state.userInput.length;

        // Hour part
        for (let i = 0; i < 2; i++) {
            const span = document.createElement('span');
            if (i < inputLen) {
                span.textContent = state.userInput[i];
            } else {
                span.textContent = '_';
                span.style.color = 'var(--placeholder-color)';
            }
            els.userInput.appendChild(span);
        }

        // Colon
        const colonSpan = document.createElement('span');
        colonSpan.textContent = ':';
        colonSpan.style.color = 'var(--text-color)';
        colonSpan.style.margin = '0 2px';
        els.userInput.appendChild(colonSpan);

        // Minute part
        for (let i = 2; i < 4; i++) {
            const span = document.createElement('span');
            if (i < inputLen) {
                span.textContent = state.userInput[i];
            } else {
                span.textContent = '_';
                span.style.color = 'var(--placeholder-color)';
            }
            els.userInput.appendChild(span);
        }
    } else {
        // Other modes: simple display
        for (let char of state.userInput) {
            const span = document.createElement('span');
            span.textContent = char;
            els.userInput.appendChild(span);
        }

        const remaining = state.currentAnswer.length - state.userInput.length;
        if (remaining > 0) {
            for (let i = 0; i < remaining; i++) {
                const span = document.createElement('span');
                span.textContent = '_';
                span.style.color = 'var(--placeholder-color)';
                span.style.opacity = '1';
                span.style.margin = '0 2px';
                els.userInput.appendChild(span);
            }
        }
    }
}

function checkAnswer() {
    if (!state.currentAnswer) return;

    state.stats.total++;
    const correct = state.userInput === state.currentAnswer;

    // Save to history
    saveToHistory(correct);

    if (correct) {
        state.stats.correct++;
        showMessage("正确! " + state.currentDisplay, "correct");
        setTimeout(nextQuestion, 1000);
    } else {
        showMessage("错误! 正确答案: " + state.currentDisplay, "incorrect");
        setTimeout(nextQuestion, 2500);
    }
    updateStats();
}

function showMessage(text, type) {
    els.messageArea.textContent = text;
    els.messageArea.className = `message ${type}`;
}

// History functions
function saveToHistory(correct) {
    const record = {
        id: Date.now(),
        timestamp: new Date(),
        mode: state.currentMode,
        correct: correct,
        userAnswer: state.userInput,
        correctAnswer: state.currentDisplay
    };
    state.history.unshift(record); // Add to beginning
    // Limit history to 100 records
    if (state.history.length > 100) {
        state.history.pop();
    }
    // Save to localStorage
    saveHistoryToStorage();
}

function saveHistoryToStorage() {
    try {
        const historyToSave = state.history.map(h => ({
            ...h,
            timestamp: h.timestamp.toISOString()
        }));
        localStorage.setItem('practiceHistory', JSON.stringify(historyToSave));
    } catch (e) {
        console.warn('Failed to save history to localStorage:', e);
    }
}

function loadHistoryFromStorage() {
    try {
        const saved = localStorage.getItem('practiceHistory');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.history = parsed.map(h => ({
                ...h,
                timestamp: new Date(h.timestamp)
            }));
        }
    } catch (e) {
        console.warn('Failed to load history from localStorage:', e);
    }
}

function renderHistory() {
    if (state.history.length === 0) {
        els.historyList.innerHTML = '<div class="history-empty">暂无记录</div>';
        return;
    }

    els.historyList.innerHTML = '';
    state.history.forEach(record => {
        const item = document.createElement('div');
        item.className = `history-item ${record.correct ? 'correct' : 'incorrect'}`;

        const timeStr = formatTime(record.timestamp);
        const modeName = modeNames[record.mode] || record.mode;

        item.innerHTML = `
            <div class="history-info">
                <div class="history-type">${modeName}</div>
                <div class="history-content">
                    ${record.correctAnswer}
                    ${!record.correct ? ` <span style="color:var(--error-color)">(你的: ${record.userAnswer || '空'})</span>` : ''}
                </div>
            </div>
            <div class="history-time">${timeStr}</div>
            <div class="history-result ${record.correct ? 'correct' : 'incorrect'}">
                ${record.correct ? '✓' : '✗'}
            </div>
        `;

        els.historyList.appendChild(item);
    });
}

function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        state.history = [];
        localStorage.removeItem('practiceHistory');
        renderHistory();
    }
}

function openHistory() {
    renderHistory();
    els.historyModal.classList.remove('hidden');
}

function closeHistory() {
    els.historyModal.classList.add('hidden');
}

// Input Handling
function handleKey(key) {
    if (key === 'backspace') {
        state.userInput = state.userInput.slice(0, -1);
    } else if (key === 'enter') {
        checkAnswer();
        return;
    } else {
        if (state.userInput.length < state.currentAnswer.length) {
             state.userInput += key;
        }
    }
    
    renderInput();
    
    if (state.settings.autoSubmit && state.userInput.length === state.currentAnswer.length) {
        checkAnswer();
    }
}

// Replay button logic
// Overwrite nextQuestion to store current speak text
const originalNext = nextQuestion;
// Redefine to capture speak text properly
// Wait, the generators logic is inside nextQuestion.
// Let's modify nextQuestion to store state.currentSpeak
// (Already doing this? No, previous write didn't include it in generators logic, it was a separate patch)
// Let's ensure generators return speak text and we store it.

// Listeners
els.settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    els.settingsPanel.classList.toggle('hidden');
});

// Close settings panel when clicking outside
document.addEventListener('click', (e) => {
    if (!els.settingsPanel.classList.contains('hidden')) {
        // Check if click is outside settings panel and settings button
        if (!els.settingsPanel.contains(e.target) && e.target !== els.settingsBtn && !els.settingsBtn.contains(e.target)) {
            els.settingsPanel.classList.add('hidden');
        }
    }
    // Close history modal if open (this is handled separately but keeping for clarity)
    if (!els.historyModal.classList.contains('hidden') && e.target === els.historyModal) {
        closeHistory();
    }
});

// Prevent clicks inside settings panel from closing it
els.settingsPanel.addEventListener('click', (e) => {
    e.stopPropagation();
});

// History button listeners
els.historyBtn.addEventListener('click', openHistory);
els.historyCloseBtn.addEventListener('click', closeHistory);
els.historyClearBtn.addEventListener('click', clearHistory);


els.keys.forEach(k => {
    k.addEventListener('click', () => {
        const key = k.dataset.key;
        handleKey(key);
    });
});

// Re-implement NextQuestion properly with state.currentSpeak
// And Replay logic
// (Overwriting the previous definition)
nextQuestion = function() {
    const availableModes = state.settings.modes;
    if (availableModes.length === 0) {
        alert("请至少选择一种模式!");
        return;
    }
    const mode = availableModes[Math.floor(Math.random() * availableModes.length)];
    state.currentMode = mode;

    const gen = generators[mode]();
    state.currentAnswer = gen.answer;
    state.currentDisplay = gen.display;
    state.currentSpeak = gen.speak; // Store!
    state.userInput = '';

    renderInput();
    updateHint();

    els.messageArea.textContent = '';
    els.messageArea.className = 'message hidden';

    speak(gen.speak);
};

// Click on input area to replay
document.getElementById('input-area').addEventListener('click', () => {
    if (state.currentSpeak) speak(state.currentSpeak);
});

document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') handleKey(e.key);
    if (e.key === 'Backspace') handleKey('backspace');
    if (e.key === 'Enter') handleKey('enter');
    if (e.key === ' ') {
        e.preventDefault(); // Prevent scroll
        if (state.currentSpeak) speak(state.currentSpeak);
    }
});

// Theme toggle button - switch between dark and light mode
els.themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('theme-light');
    // Update icon visibility
    if (isLight) {
        els.iconSun.classList.add('hidden');
        els.iconMoon.classList.remove('hidden');
    } else {
        els.iconSun.classList.remove('hidden');
        els.iconMoon.classList.add('hidden');
    }
    // Save preference
    state.settings.theme = isLight ? 'light' : 'dark';
});

els.modesContainer.addEventListener('change', (e) => {
    const checked = Array.from(els.modesContainer.querySelectorAll('input:checked')).map(i => i.value);
    state.settings.modes = checked;
});

els.autoSubmit.addEventListener('change', (e) => {
    state.settings.autoSubmit = e.target.checked;
});

els.languageSelect.addEventListener('change', (e) => {
    state.settings.language = e.target.value;
    loadVoices();
});

els.voiceSelect.addEventListener('change', (e) => {
    const voices = window.speechSynthesis.getVoices();
    state.settings.voice = voices.find(v => v.name === e.target.value);
});

function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    els.voiceSelect.innerHTML = '<option value="">默认</option>';
    voices.filter(v => v.lang.startsWith(state.settings.language.split('-')[0])).forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang})`;
        els.voiceSelect.appendChild(opt);
    });
}

window.speechSynthesis.onvoiceschanged = loadVoices;

loadVoices();
// Load history from localStorage
loadHistoryFromStorage();
// Wait a bit for voices to load?
setTimeout(nextQuestion, 100);
