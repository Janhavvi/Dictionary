const wordInput = document.getElementById('word-input');
const searchBtn = document.getElementById('search-btn');
const resultsContainer = document.getElementById('results-container');

wordInput.addEventListener('input', () => {
    searchBtn.disabled = wordInput.value.trim() === '';
});

searchBtn.addEventListener('click', searchWord);
wordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !searchBtn.disabled) {
        searchWord();
    }
});

function searchWord() {
    const word = wordInput.value.trim();
    fetchWordData(word);
}

async function fetchWordData(word) {
    resultsContainer.innerHTML = '<div class="loader"></div>';

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                displayError('Word not found. Please check your spelling or try another word.');
            } else {
                displayError('Something went wrong. Please try again later.');
            }
            return;
        }

        const data = await response.json();
        displayResults(data[0]);

    } catch (error) {
        displayError('A network error occurred. Please check your internet connection.');
    }
}

function displayResults(wordData) {
    resultsContainer.innerHTML = '';

    const resultCard = document.createElement('div');
    resultCard.classList.add('result-card');

    const phoneticText = wordData.phonetic || (wordData.phonetics.find(p => p.text) || {}).text || '';
    const audioData = wordData.phonetics.find(p => p.audio);

    let audioBtnHTML = '';
    if (audioData && audioData.audio) {
        audioBtnHTML = `
            <button id="audio-btn" onclick="playAudio('${audioData.audio}')">
                <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
            </button>
        `;
    }

    resultCard.innerHTML = `
        <div class="word-section">
            <div>
                <h2 class="word-title">${wordData.word}</h2>
                <p class="phonetic">${phoneticText}</p>
            </div>
            ${audioBtnHTML}
        </div>
    `;

    wordData.meanings.forEach(meaning => {
        const meaningSection = document.createElement('div');
        meaningSection.classList.add('meaning-section');

        let definitionsHTML = '';
        meaning.definitions.forEach(def => {
            const exampleHTML = def.example ? `<p class="example">"${def.example}"</p>` : '';
            definitionsHTML += `
                <div class="definition">
                    <p>${def.definition}</p>
                    ${exampleHTML}
                </div>
            `;
        });

        meaningSection.innerHTML = `
            <div class="part-of-speech">${meaning.partOfSpeech}</div>
            ${definitionsHTML}
        `;
        resultCard.appendChild(meaningSection);
    });

    resultsContainer.appendChild(resultCard);
}

function playAudio(audioSrc) {
    const audio = new Audio(audioSrc);
    audio.play();
}

function displayError(message) {
    resultsContainer.innerHTML = `<div class="error-card">${message}</div>`;
}
