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
    currentMode: 'number'
};

// DOM Elements
const els = {
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    themeSelect: document.getElementById('header-theme-select'),
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

// Generators
const generators = {
    'number': () => {
        const n = Math.floor(Math.random() * 10000); // 0 - 9999
        return { speak: n.toString(), display: n.toString(), answer: n.toString() };
    },
    'long-number': () => {
        const n = Math.floor(Math.random() * 1000000000); 
        return { speak: n.toString(), display: n.toLocaleString(), answer: n.toString() };
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
        return { speak: y.toString(), display: y.toString(), answer: y.toString() };
    },
    'time': () => {
        const h = Math.floor(Math.random() * 24);
        const m = Math.floor(Math.random() * 60);
        const mStr = m.toString().padStart(2, '0');
        let speak = `${h} ${m}`;
        if (m < 10) speak = `${h} oh ${m}`;
        if (m === 0) speak = `${h} o'clock`;
        const answer = `${h}${mStr}`; 
        return { speak: speak, display: `${h}:${mStr}`, answer: `${h}${mStr}` };
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
    state.userInput = '';
    
    // 3. UI Reset
    renderInput();
    updateHint(); // Explicitly call updateHint
    
    els.messageArea.textContent = '';
    els.messageArea.className = 'message hidden';
    
    // 4. Speak
    speak(gen.speak);
    console.log("Target:", gen.answer);
}

function renderInput() {
    els.userInput.innerHTML = '';
    
    for (let char of state.userInput) {
        const span = document.createElement('span');
        span.textContent = char;
        els.userInput.appendChild(span);
    }
    
    if (state.currentAnswer) {
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

// Input Handling
function handleKey(key) {
    if (key === 'backspace') {
        state.userInput = state.userInput.slice(0, -1);
    } else if (key === 'enter') {
        checkAnswer();
        return;
    } else if (key === 'replay') {
        speak(generators[state.settings.modes[0]] ? generators[state.settings.modes[0]]().speak : ''); 
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
els.settingsBtn.addEventListener('click', () => {
    els.settingsPanel.classList.toggle('hidden');
});

els.keys.forEach(k => {
    k.addEventListener('click', () => {
        const key = k.dataset.key;
        if (key === 'replay') {
            // Use state.currentAnswer to re-generate speak? No.
            // We need to store current speak text.
            // Let's hack it: re-read from currentDisplay? No.
            // Better: Store it in state.
            // Since I'm rewriting the whole file, I'll fix nextQuestion below.
        } else {
            handleKey(key);
        }
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

// Replay Button listener
const replayBtn = document.getElementById('replay-btn');
if (replayBtn) {
    replayBtn.addEventListener('click', () => {
        if (state.currentSpeak) speak(state.currentSpeak);
    });
}

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

els.themeSelect.addEventListener('change', (e) => {
    state.settings.theme = e.target.value;
    document.body.className = ''; 
    if (e.target.value !== 'default') {
        document.body.classList.add(`theme-${e.target.value}`);
    }
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
// Wait a bit for voices to load?
setTimeout(nextQuestion, 100);
