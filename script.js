// Simple DoomStop MVP script

/*
 * DoomStop MVP script (enhanced)
 *
 * The original prototype shipped with hard‑coded trivia questions, memes and
 * quick‑win prompts. This version adds support for retrieving those
 * content items from a backend API if available. If the backend is not
 * reachable, the app gracefully falls back to the local arrays defined
 * below. To change the backend target, set the API_BASE constant. A
 * simple FastAPI service is provided in the doomstop_backend package.
 */

// Backend base URL. Update this constant to point to your deployed API.
// When deploying to Render, set this to the Render service URL. When running locally,
// you can switch back to `http://localhost:8000`.
const API_BASE = 'https://doomstop-backend.onrender.com';

// Local fallback data. These will be used if the backend cannot be
// contacted. Feel free to extend or modify them.
let triviaQuestions = [
    { id: 1, question: 'What is the capital of France?', options: ['Paris', 'Berlin', 'London'], answer: 'Paris' },
    { id: 2, question: 'How many continents are there?', options: ['5', '6', '7'], answer: '7' },
    { id: 3, question: 'What planet is known as the Red Planet?', options: ['Mars', 'Venus', 'Saturn'], answer: 'Mars' },
    { id: 4, question: 'Which ocean is the largest?', options: ['Atlantic', 'Pacific', 'Indian'], answer: 'Pacific' },
    { id: 5, question: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen'], answer: 'Carbon dioxide' },
];

let memes = [
    'Keep calm and carry on! 😄',
    'Here’s a puppy to brighten your day 🐶',
    'Remember: you are awesome! 💪',
    'Take a deep breath and smile 😊',
    'Life is better when you’re laughing 😂'
];

let quickWins = [
    'You drank a glass of water – hydration win! 💧',
    'You stood up and stretched – good for you! 🦌‍♂️',
    'You read a page of a book – knowledge gained 📚',
    'You wrote down one thing you’re grateful for – gratitude boost 🙏',
    'You smiled at a stranger – positivity shared 😊'
];

// Attempt to load loops from the backend API. If the request fails, the
// console will show a warning and the app will continue using the local
// arrays. This fetch is non‑blocking; if it succeeds the arrays will be
// replaced with the backend data.
async function loadContentFromApi() {
    try {
        const resp = await fetch(`${API_BASE}/loops`);
        if (!resp.ok) {
            console.warn('Failed to fetch loops from backend, using fallback data');
            return;
        }
        const loops = await resp.json();
        triviaQuestions = [];
        memes = [];
        quickWins = [];
        loops.forEach(loop => {
            if (loop.type === 'trivia') {
                triviaQuestions.push(loop.content);
            } else if (loop.type === 'meme') {
                memes.push(loop.content.text);
            } else if (loop.type === 'quick_win') {
                quickWins.push(loop.content.text);
            }
        });
        console.log('Loaded loops from backend');
    } catch (err) {
        console.warn('Error contacting backend:', err);
    }
}

// Kick off the content load. It's okay if this finishes after initial
// rendering – subsequent loops will use the updated content.
loadContentFromApi();

// Utility functions for localStorage
function loadStats() {
    const total = parseInt(localStorage.getItem('totalEscapes')) || 0;
    const todayDate = new Date().toDateString();
    const todayData = JSON.parse(localStorage.getItem('todayEscapes')) || {};
    const todayCount = todayData.date === todayDate ? todayData.count : 0;
    return { total, todayCount };
}

async function updateStats(inc = 1) {
    // Update local stats in browser storage
    const { total, todayCount } = loadStats();
    const newTotal = total + inc;
    const todayDate = new Date().toDateString();
    const newTodayData = { date: todayDate, count: todayCount + inc };
    localStorage.setItem('totalEscapes', newTotal);
    localStorage.setItem('todayEscapes', JSON.stringify(newTodayData));
    document.getElementById('totalEscapes').innerText = newTotal;
    document.getElementById('todayEscapes').innerText = newTodayData.count;

    // Also record the escape with the backend if available. We use a
    // hard‑coded user ID for the MVP; in a real app this would come
    // from authentication. We mark the success flag as true (always) for
    // simplicity. This request is fire‑and‑forget; errors are logged
    // but do not block the UI.
    try {
        await fetch(`${API_BASE}/users/guest/loop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Provide the API key so the backend accepts the request. In a real
                // implementation this should be kept secret on the server side.
                'Authorization': 'Bearer doomstop-secret-token'
            },
            body: JSON.stringify({ loop_id: 0, success: true })
        });
    } catch (err) {
        console.warn('Failed to record escape with backend:', err);
    }
}

function initializeStats() {
    const { total, todayCount } = loadStats();
    document.getElementById('totalEscapes').innerText = total;
    document.getElementById('todayEscapes').innerText = todayCount;
}

// Trivia loop handler
function startTrivia() {
    const contentDiv = document.getElementById('content');
    // pick random question
    const q = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
    const questionEl = document.createElement('p');
    questionEl.textContent = q.question;
    contentDiv.innerHTML = '';
    contentDiv.appendChild(questionEl);
    q.options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'loop-btn';
        btn.onclick = () => {
            if (option === q.answer) {
                contentDiv.innerHTML = `<p>Correct! 🎉 ${q.answer} is the right answer.</p>`;
            } else {
                contentDiv.innerHTML = `<p>Oops! The correct answer was ${q.answer}. Try another loop!</p>`;
            }
            updateStats(1);
        };
        contentDiv.appendChild(btn);
    });
}

// Meme loop handler
function showMeme() {
    const contentDiv = document.getElementById('content');
    const meme = memes[Math.floor(Math.random() * memes.length)];
    contentDiv.innerHTML = `<p>${meme}</p>`;
    updateStats(1);
}

// Quick win loop handler
function showQuickWin() {
    const contentDiv = document.getElementById('content');
    const win = quickWins[Math.floor(Math.random() * quickWins.length)];
    contentDiv.innerHTML = `<p>${win}</p>`;
    updateStats(1);
}

// Attach event handlers
document.getElementById('triviaBtn').addEventListener('click', startTrivia);
document.getElementById('memeBtn').addEventListener('click', showMeme);
document.getElementById('quickWinBtn').addEventListener('click', showQuickWin);

initializeStats();
