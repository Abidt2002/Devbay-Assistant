/* ============================================================
   DevBay Chatbot - Animated Answers + Auto Scroll + CSV Support
   ============================================================ */

let chatbotData = [];
const CSV_FILE = 'DevBay_Chatbot_QA.csv';

/* ---------- CSV Parsing ---------- */
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
  let startIndex = 0;
  const first = lines[0].toLowerCase();
  if (first.includes('question') && first.includes('answer')) startIndex = 1;

  const rows = [];
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 2) {
      rows.push({ question: parts[0].trim(), answer: parts.slice(1).join(',').trim() });
    }
  }
  return rows;
}

/* ---------- Normalization & Tokenization ---------- */
function normalizeText(t) {
  return (t || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokenize(t) {
  return normalizeText(t).split(' ').filter(Boolean);
}

/* ---------- Load CSV ---------- */
async function loadChatbotData() {
  try {
    const res = await fetch(CSV_FILE);
    const text = await res.text();
    const rows = parseCSV(text);
    chatbotData = rows.map(r => ({
      question: normalizeText(r.question),
      rawQuestion: r.question,
      answer: r.answer
    }));
    console.log('✅ Loaded', chatbotData.length, 'QA entries');
  } catch (err) {
    console.error('❌ CSV load error:', err);
    chatbotData = [{
      question: 'what is devbay',
      answer: 'DevBay Technologies is a modern IT company offering web, mobile, and AI solutions.'
    }];
  }
}

/* ---------- Matching Logic ---------- */
function findBestAnswer(input) {
  const qNorm = normalizeText(input);
  const qTokens = tokenize(qNorm);
  let best = { score: 0, answer: null };

  for (const item of chatbotData) {
    const iTokens = tokenize(item.question);
    let match = 0;
    for (const t of qTokens) if (iTokens.includes(t)) match++;
    const score = match / qTokens.length;
    if (score > best.score) best = { score, answer: item.answer };
  }
  return best.score > 0.25 ? best.answer : null;
}

/* ---------- UI Helpers ---------- */
function createMessage(text, cls) {
  const div = document.createElement('div');
  div.className = 'message ' + cls;
  div.innerHTML = text;
  return div;
}

function addUserMessage(text) {
  const box = document.getElementById('chat-box');
  const msg = createMessage(text, 'user');
  box.appendChild(msg);
  box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
}

/* ---------- Typing Animation ---------- */
async function addBotMessageAnimated(text) {
  const box = document.getElementById('chat-box');
  const msg = createMessage('', 'bot');
  box.appendChild(msg);

  for (let i = 0; i < text.length; i++) {
    msg.innerHTML += text[i];
    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    await new Promise(r => setTimeout(r, 25)); // adjust speed here (ms per character)
  }
}

/* ---------- Event Handling ---------- */
async function handleSend() {
  const input = document.getElementById('user-input');
  const text = input.value.trim();
  if (!text) return;
  addUserMessage(text);
  input.value = '';
  input.focus();

  await new Promise(r => setTimeout(r, 400)); // slight delay
  const answer = findBestAnswer(text);

  if (answer) {
    await addBotMessageAnimated(answer);
  } else {
    await addBotMessageAnimated("🤖 Sorry, I couldn’t find an exact match. Try asking differently about DevBay’s services or contact info.");
  }
}

/* ---------- UI Control (open/close) ---------- */
function wireUI() {
  const icon = document.getElementById('chat-icon');
  const chat = document.getElementById('devbay-chat');
  const closeBtn = document.getElementById('close-chat');
  const sendBtn = document.getElementById('send-btn');

  let open = false;

  icon.addEventListener('click', () => {
    open = !open;
    chat.style.display = open ? 'flex' : 'none';
  });
  closeBtn.addEventListener('click', () => {
    open = false;
    chat.style.display = 'none';
  });

  sendBtn.addEventListener('click', handleSend);
  document.getElementById('user-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSend();
  });

  // Welcome message
  const box = document.getElementById('chat-box');
  const welcome = createMessage("👋 Hi! I’m DevBay Assistant. How can I help you today?", 'bot');
  box.appendChild(welcome);
}

/* ---------- Init ---------- */
(async function init() {
  await loadChatbotData();
  wireUI();
})();


