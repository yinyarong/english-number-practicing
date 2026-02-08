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
        theme: 'default',
        modes: ['number', 'date', 'time', 'year'], // default active
        voice: null,
        autoSubmit: true
    },
    isSpeaking: false
};

// DOM Elements
const els = {
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    themeSelect: document.getElementById('theme-select'),
    languageSelect: document.getElementById('language-select'),
    voiceSelect: document.getElementById('voice-select'),
    modesContainer: document.getElementById('modes-container'),
    autoSubmit: document.getElementById('auto-submit'),
    
    statTotal: document.getElementById('stat-total'),
    statCorrect: document.getElementById('stat-correct'),
    statAccuracy: document.getElementById('stat-accuracy'),
    
    userInput: document.getElementById('user-input'),
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
        // Grouping for speech often helps: 138 1234 5678
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
        const hStr = h.toString(); // 24h format usually
        // 12:05 -> twelve oh five
        let speak = `${h} ${m}`;
        if (m < 10) speak = `${h} oh ${m}`;
        if (m === 0) speak = `${h} o'clock`;
        
        const answer = `${h}${mStr}`; // Expecting 1230 for 12:30 or 905 for 9:05?
        // Reference implies simple number input. Let's assume standard HHMM input or Colon.
        // Simplified: User inputs numbers. We format visually?
        // For simplicity, let's require HHMM format input without colon
        return { speak: speak, display: `${h}:${mStr}`, answer: `${h}${mStr}` };
    },
    'date': () => {
        // Simple year/month/day
        const y = Math.floor(Math.random() * (2025 - 2000) + 2000);
        const m = Math.floor(Math.random() * 12) + 1;
        const d = Math.floor(Math.random() * 28) + 1;
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        // Speak: "July 4th 2020"
        // Ordinal suffix
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
        // Expected input: 20200704 or similar? 
        // Let's stick to standard YYYYMMDD for input simplicity
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
        }
        
        // Visual feedback
        state.isSpeaking = true;
        els.playIcon.style.opacity = 0.5;
        
        utterance.onend = () => {
            state.isSpeaking = false;
            els.playIcon.style.opacity = 1;
        };
        
        window.speechSynthesis.speak(utterance);
    }
}

function nextQuestion() {
    // 1. Pick a mode from active modes
    const availableModes = state.settings.modes;
    if (availableModes.length === 0) {
        alert("Please select at least one mode!");
        return;
    }
    const mode = availableModes[Math.floor(Math.random() * availableModes.length)];
    
    // 2. Generate
    const gen = generators[mode]();
    state.currentAnswer = gen.answer;
    state.currentDisplay = gen.display;
    state.userInput = '';
    
    // 3. UI Reset
    renderInput();
    els.messageArea.textContent = '';
    els.messageArea.className = 'message hidden';
    
    // 4. Speak
    speak(gen.speak);
    console.log("Target:", gen.answer); // Debug
}

function renderInput() {
    // Clear display first
    els.userInput.innerHTML = '';
    
    // Create spans for input digits
    for (let char of state.userInput) {
        const span = document.createElement('span');
        span.textContent = char;
        els.userInput.appendChild(span);
    }
    
    // Create spans for placeholders
    if (state.currentAnswer) {
        const remaining = state.currentAnswer.length - state.userInput.length;
        if (remaining > 0) {
            for (let i = 0; i < remaining; i++) {
                const span = document.createElement('span');
                span.textContent = '_';
                // Use variable for color to support themes
                span.style.color = 'var(--placeholder-color)'; 
                span.style.opacity = '1'; // Opacity handled by color var or theme
                span.style.margin = '0 2px'; 
                els.userInput.appendChild(span);
            }
        }
    }
}

function checkAnswer() {
    if (!state.currentAnswer) return;
    
    // Only check if length matches or user forced enter
    // But wait, auto-submit logic calls this.
    
    state.stats.total++;
    const correct = state.userInput === state.currentAnswer;
    
    if (correct) {
        state.stats.correct++;
        showMessage("Correct! " + state.currentDisplay, "correct");
        setTimeout(nextQuestion, 1000);
    } else {
        // Feature: Automatically show correct answer if wrong
        showMessage("Wrong! Correct: " + state.currentDisplay, "incorrect");
        
        // Show correct answer in input display too for visual feedback?
        // Or just keep it in message area. Message area is good.
        // But user asked: "如果是错了，它会显示正确答案"
        
        // Feature: "如果是正确，就自动下一个练习" (Already implemented)
        // User didn't say auto-next if wrong, but implies flow.
        // Let's keep the delay then next.
        setTimeout(nextQuestion, 2500); // Slightly longer delay to read answer
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
        // Note: The replay logic is handled by the event listener wrapper below using state.currentSpeak
    } else {
        // Limit length to answer length?
        if (state.userInput.length < state.currentAnswer.length) {
             state.userInput += key;
        }
    }
    
    renderInput();
    
    // Auto-submit check
    if (state.settings.autoSubmit && state.userInput.length === state.currentAnswer.length) {
        // If length matches, submit automatically!
        checkAnswer();
    }
}

// Fix Replay
// We need to overwrite the generator call in nextQuestion to store the speak text
const originalNext = nextQuestion;
nextQuestion = function() {
    const availableModes = state.settings.modes;
    if (availableModes.length === 0) return;
    const mode = availableModes[Math.floor(Math.random() * availableModes.length)];
    const gen = generators[mode]();
    
    state.currentAnswer = gen.answer;
    state.currentDisplay = gen.display;
    state.currentSpeak = gen.speak; // Store for replay
    state.userInput = '';
    
    renderInput();
    els.messageArea.textContent = '';
    els.messageArea.className = 'message hidden';
    
    speak(gen.speak);
};

// Listeners
els.settingsBtn.addEventListener('click', () => {
    els.settingsPanel.classList.toggle('hidden');
});

els.keys.forEach(k => {
    k.addEventListener('click', () => {
        const key = k.dataset.key;
        if (key === 'replay') {
            speak(state.currentSpeak);
        } else {
            handleKey(key);
        }
    });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') handleKey(e.key);
    if (e.key === 'Backspace') handleKey('backspace');
    if (e.key === 'Enter') handleKey('enter');
    if (e.key === ' ') speak(state.currentSpeak); // Space to replay
});

// Settings Listeners
els.themeSelect.addEventListener('change', (e) => {
    state.settings.theme = e.target.value;
    document.body.className = ''; // clear previous
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

// Init Voices
function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    els.voiceSelect.innerHTML = '<option value="">Default</option>';
    voices.filter(v => v.lang.startsWith(state.settings.language.split('-')[0])).forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang})`;
        els.voiceSelect.appendChild(opt);
    });
}

window.speechSynthesis.onvoiceschanged = loadVoices;

// Start
loadVoices();
nextQuestion();
