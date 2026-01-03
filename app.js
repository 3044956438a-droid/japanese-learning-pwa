// ========== 全局变量 ==========
let words = [];
let currentIndex = 0;
let isTestMode = false;
let answerVisible = true;

// ========== 初始化 ==========
window.addEventListener('load', function() {
    // 从localStorage加载数据，如果没有则使用默认数据
    loadWordsFromStorage();
    
    // 初始化界面
    updateDisplay();
    updateStats();
    
    // 设置事件监听
    setupEventListeners();
    
    // 注册Service Worker
    registerServiceWorker();
});

// ========== 数据管理 ==========
function loadWordsFromStorage() {
    const saved = localStorage.getItem('japaneseWords');
    if (saved) {
        words = JSON.parse(saved);
    } else {
        words = [...wordsData];
        saveWordsToStorage();
    }
}

function saveWordsToStorage() {
    localStorage.setItem('japaneseWords', JSON.stringify(words));
}

// ========== 界面更新 ==========
function updateDisplay() {
    const word = words[currentIndex];
    
    document.getElementById('japanese').textContent = word.japanese;
    document.getElementById('romaji').textContent = word.romaji;
    document.getElementById('chinese').textContent = word.chinese;
    document.getElementById('progress').textContent = `第 ${currentIndex + 1}/${words.length} 个单词`;
    
    // 测试模式下隐藏答案
    if (isTestMode && !answerVisible) {
        document.getElementById('chinese').classList.add('hidden');
    } else {
        document.getElementById('chinese').classList.remove('hidden');
    }
}

function updateStats() {
    let totalCorrect = 0;
    let totalIncorrect = 0;
    
    words.forEach(word => {
        totalCorrect += word.correct;
        totalIncorrect += word.incorrect;
    });
    
    const total = totalCorrect + totalIncorrect;
    const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
    
    document.getElementById('correctCount').textContent = totalCorrect;
    document.getElementById('incorrectCount').textContent = totalIncorrect;
    document.getElementById('accuracy').textContent = accuracy + '%';
}

// ========== 事件处理 ==========
function setupEventListeners() {
    // 下一个按钮
    document.getElementById('nextBtn').addEventListener('click', nextWord);
    
    // 语音按钮
    document.getElementById('speakBtn').addEventListener('click', () => {
        speak(words[currentIndex].japanese);
    });
    
    // 显示/隐藏答案按钮
    document.getElementById('toggleBtn').addEventListener('click', toggleAnswer);
    
    // 对错按钮
    document.getElementById('correctBtn').addEventListener('click', () => {
        markAnswer(true);
    });
    
    document.getElementById('incorrectBtn').addEventListener('click', () => {
        markAnswer(false);
    });
    
    // 模式切换
    document.getElementById('learningMode').addEventListener('click', () => {
        setMode(false);
    });
    
    document.getElementById('testMode').addEventListener('click', () => {
        setMode(true);
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
            event.preventDefault();
            nextWord();
        } else if (event.code === 'KeyS') {
            speak(words[currentIndex].japanese);
        } else if (event.code === 'KeyH') {
            toggleAnswer();
        }
    });
}

// ========== 核心功能 ==========
function nextWord() {
    currentIndex = (currentIndex + 1) % words.length;
    answerVisible = !isTestMode;
    updateDisplay();
    
    if (!isTestMode) {
        speak(words[currentIndex].japanese);
    }
}

function toggleAnswer() {
    answerVisible = !answerVisible;
    updateDisplay();
}

function markAnswer(isCorrect) {
    const word = words[currentIndex];
    
    if (isCorrect) {
        word.correct++;
        word.interval = Math.min(word.interval * 2, 30);
    } else {
        word.incorrect++;
        word.interval = 1;
    }
    
    word.lastReview = new Date().toISOString();
    word.nextReview = new Date(Date.now() + word.interval * 24 * 60 * 60 * 1000).toISOString();
    
    saveWordsToStorage();
    updateStats();
    
    // 自动切换到下一个
    setTimeout(() => {
        nextWord();
    }, 500);
}

function setMode(testMode) {
    isTestMode = testMode;
    answerVisible = !testMode;
    
    // 更新按钮状态
    if (testMode) {
        document.getElementById('testMode').classList.add('active');
        document.getElementById('learningMode').classList.remove('active');
    } else {
        document.getElementById('learningMode').classList.add('active');
        document.getElementById('testMode').classList.remove('active');
    }
    
    updateDisplay();
}

// ========== 语音功能 ==========
function speak(text) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(text)}`;
    
    const audio = new Audio(url);
    audio.play().catch(function(error) {
        console.log('语音播放失败:', error);
    });
}

// ========== Service Worker 注册 ==========
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker 注册成功');
            })
            .catch(error => {
                console.log('Service Worker 注册失败:', error);
            });
    }
}

// ========== 初始化模式 ==========
document.getElementById('learningMode').classList.add('active');