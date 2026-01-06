const wordInput = document.getElementById('word-input');
const searchBtn = document.getElementById('search-btn');
const resultsContainer = document.getElementById('results-container');

searchBtn.addEventListener('click', searchWord);
wordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        searchWord();
    }
});

function searchWord() {
    const word = wordInput.value.trim();

    if (word === '') {
        displayError('Please enter a word to search.');
        return;
    }

    fetchWordData(word);
}

async function fetchWordData(word) {
    resultsContainer.innerHTML = '<div class="loader"></div>';

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                displayError('Word not found. Please try another word.');
            } else {
                displayError('An error occurred. Please try again later.');
            }
            return;
        }

        const data = await response.json();
        displayResults(data[0]);

    } catch (error) {
        displayError('A network error occurred. Please check your connection.');
    }
}

function displayResults(wordData) {
    resultsContainer.innerHTML = '';

    const result = document.createElement('div');
    result.classList.add('result');

    const word = document.createElement('h2');
    word.textContent = wordData.word;
    result.appendChild(word);

    if (wordData.phonetic) {
        const phonetic = document.createElement('p');
        phonetic.classList.add('phonetic');
        phonetic.textContent = wordData.phonetic;
        result.appendChild(phonetic);
    }

    wordData.meanings.forEach(meaning => {
        const partOfSpeech = document.createElement('p');
        partOfSpeech.textContent = `Part of Speech: ${meaning.partOfSpeech}`;
        result.appendChild(partOfSpeech);

        meaning.definitions.forEach(definition => {
            const definitionText = document.createElement('p');
            definitionText.textContent = `Definition: ${definition.definition}`;
            result.appendChild(definitionText);

            if (definition.example) {
                const example = document.createElement('p');
                example.textContent = `Example: ${definition.example}`;
                result.appendChild(example);
            } else {
                const example = document.createElement('p');
                example.textContent = 'Example not available';
                result.appendChild(example);
            }
        });
    });

    const audio = wordData.phonetics.find(phonetic => phonetic.audio);
    if (audio) {
        const audioBtn = document.createElement('button');
        audioBtn.id = 'audio-btn';
        audioBtn.textContent = 'Play Audio';
        audioBtn.addEventListener('click', () => {
            const audioPlayer = new Audio(audio.audio);
            audioPlayer.play();
        });
        result.appendChild(audioBtn);
    }

    resultsContainer.appendChild(result);
}

function displayError(message) {
    resultsContainer.innerHTML = `<p class="error">${message}</p>`;
}
