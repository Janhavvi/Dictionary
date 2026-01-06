const wordInput = document.getElementById('word-input');
const searchBtn = document.getElementById('search-btn');
const tabsContainer = document.getElementById('tabs-container');
const contentArea = document.getElementById('content-area');
const flipperContainer = document.getElementById('results-flipper');
const flipper = flipperContainer.querySelector('.flipper');
const resultsFront = document.getElementById('results-front');
const resultsBack = document.getElementById('results-back');
const initialStateContainer = document.getElementById('initial-state-container');

let currentWordData = null;
let activeTab = 'pronunciation';
let isFlipping = false;

// --- EVENT LISTENERS ---
wordInput.addEventListener('input', () => {
    searchBtn.disabled = wordInput.value.trim() === '';
});

searchBtn.addEventListener('click', searchWord);
wordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !searchBtn.disabled) searchWord();
});

tabsContainer.addEventListener('click', (event) => {
    if (tabsContainer.classList.contains('is-disabled')) return;
    const newTab = event.target.closest('.tab');
    if (newTab && !newTab.classList.contains('active') && !isFlipping) {
        switchTab(newTab.dataset.tab);
    }
});

// --- CORE FUNCTIONS ---
function searchWord() {
    const word = wordInput.value.trim();
    fetchWordData(word);
}

async function fetchWordData(word) {
    tabsContainer.classList.add('is-disabled');
    initialStateContainer.innerHTML = '<div class="loader"></div>';
    initialStateContainer.classList.remove('is-hidden');
    flipperContainer.classList.add('is-hidden');

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (!response.ok) {
            throw new Error(response.status === 404 ? 'Word not found' : 'API error');
        }
        const data = await response.json();
        currentWordData = data[0];

        tabsContainer.classList.remove('is-disabled');
        initialStateContainer.classList.add('is-hidden');
        flipperContainer.classList.remove('is-hidden');
        setInitialContent();
    } catch (error) {
        displayError(error.message);
    }
}

function setInitialContent() {
    activeTab = 'pronunciation';
    updateActiveTabUI();
    flipper.style.transition = 'none';
    flipper.classList.remove('is-flipped');
    resultsFront.innerHTML = getPronunciationHTML();
    resultsBack.innerHTML = '';
    setTimeout(() => {
        flipper.style.transition = 'transform 0.7s ease-in-out';
    }, 100);
}

function switchTab(newTabName) {
    activeTab = newTabName;
    updateActiveTabUI();
    renderContent(newTabName);
}

function updateActiveTabUI() {
    tabsContainer.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === activeTab);
    });
}

function renderContent(tabName) {
    const isFlipped = flipper.classList.contains('is-flipped');
    const targetFace = isFlipped ? resultsFront : resultsBack;
    let contentHTML = '';
    switch (tabName) {
        case 'pronunciation':
            contentHTML = getPronunciationHTML();
            break;
        case 'synonyms':
            contentHTML = getSynonymsHTML();
            break;
        case 'antonyms':
            contentHTML = getAntonymsHTML();
            break;
    }
    targetFace.innerHTML = contentHTML;
    flipCard();
}

function flipCard() {
    if (isFlipping) return;
    isFlipping = true;
    flipper.classList.toggle('is-flipped');
    setTimeout(() => { isFlipping = false; }, 700);
}

// --- HTML GENERATORS ---
function getPronunciationHTML() {
    const phoneticText = currentWordData.phonetic || (currentWordData.phonetics.find(p => p.text) || {}).text || '';
    const audioData = currentWordData.phonetics.find(p => p.audio && p.audio !== '');
    const audioBtnHTML = audioData ? `<button id="audio-btn" onclick="playAudio('${audioData.audio}')"><svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3z" fill="#333"></path></svg></button>` : '';

    const definitionsHTML = currentWordData.meanings.map(meaning => {
        const definition = meaning.definitions[0];
        const exampleHTML = definition.example
            ? `<p style="font-style: italic; opacity: 0.8; margin-top: 0.5rem; padding-left: 1rem; border-left: 3px solid var(--color-accent);">"${definition.example}"</p>`
            : `<p style="font-style: italic; opacity: 0.6; margin-top: 0.5rem;">Example not available</p>`;

        return `
            <div class="definition-item" style="margin-bottom: 1.5rem;">
                <p><b>${meaning.partOfSpeech}:</b> ${definition.definition}</p>
                ${exampleHTML}
            </div>
        `;
    }).join('');

    return `
        <div class="result-card">
            <div class="word-section">
                <div>
                    <h2 class="word-title">${currentWordData.word}</h2>
                    <p class="phonetic">${phoneticText || 'No phonetic transcription available.'}</p>
                </div>
                ${audioBtnHTML}
            </div>
            <div style="padding-top: 1.5rem; border-top: 1px solid var(--color-glass-border); margin-top: 1.5rem;">
                ${definitionsHTML}
            </div>
        </div>`;
}

function getSynonymsHTML() {
    const synonyms = [...new Set(currentWordData.meanings.flatMap(m => m.synonyms || []))];
    if (synonyms.length === 0) return '<div class="result-card no-results">No synonyms available for this word.</div>';
    const chipsHTML = synonyms.map(s => `<div class="chip">${s}</div>`).join('');
    return `<div class="result-card"><div class="chip-container">${chipsHTML}</div></div>`;
}

function getAntonymsHTML() {
    const antonyms = [...new Set(currentWordData.meanings.flatMap(m => m.antonyms || []))];
    if (antonyms.length === 0) return '<div class="result-card no-results">No antonyms available for this word.</div>';
    const chipsHTML = antonyms.map(a => `<div class="chip">${a}</div>`).join('');
    return `<div class="result-card"><div class="chip-container">${chipsHTML}</div></div>`;
}

// --- UTILITY FUNCTIONS ---
function playAudio(audioSrc) {
    const audio = new Audio(audioSrc);
    audio.play().catch(e => {
        console.error("Audio playback failed:", e);
        alert("Could not play audio.");
    });
}

function displayError(message) {
    tabsContainer.classList.add('is-disabled');
    flipperContainer.classList.add('is-hidden');
    initialStateContainer.classList.remove('is-hidden');
    initialStateContainer.innerHTML = `<div class="error-card">${message}. Please try another search.</div>`;
}
