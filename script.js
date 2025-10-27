/* DevBay Chatbot - robust CSV parsing + improved matching + floating icon */

let chatbotData = []; // { question: string, answer: string }
const CSV_FILE = 'DevBay_Chatbot_QA.csv'; // ensure exact filename in repo root

/* ----------------- Utilities ----------------- */

// Parse CSV line respecting quoted fields (commas inside quotes)
function parseCSV(text) {
  // Normalize line endings and split into lines
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim() !== '');
  // If first line appears to be a header with two columns, remove it
  let startIndex = 0;
  const header = lines[0].trim();
  const headerLower = header.toLowerCase();
  if (headerLower.includes('question') || headerLower.includes('what') || headerLower.includes('answer') || headerLower.includes('response')) {
    // Heuristic: treat first line as header when it has 'question' or 'answer'
    startIndex = 1;
  }

  const rows = [];
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const parsed = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"' && line[c + 1] === '"') {
        // escaped quote inside quoted field
        cur += '"';
        c++; // skip next quote
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        parsed.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    parsed.push(cur);
    // If there are more than 2 columns, assume first is question and the rest joined as answer
    if (parsed.length >= 2) {
      const q = parsed[0].trim();
      const a = parsed.slice(1).join(',').trim();
      if (q || a) rows.push({ question: q, answer: a });
    } else if (parsed.length === 1) {
      // try splitting by tab as fallback
      const parts = parsed[0].split('\t');
      if (parts.length >= 2) rows.push({ question: parts[0].trim(), answer: parts.slice(1).join('\t').trim() });
    }
  }
  return rows;
}

function normalizeText(s) {
  return (s || '').toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^\w\s']/g, ' ') // remove punctuation but keep apostrophes
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(s) {
  if (!s) return [];
  return normalizeText(s).split(' ').filter(Boolean);
}

/* ----------------- Loading CSV ----------------- */

async function loadChatbotData() {
  try {
    const res = await fetch(CSV_FILE);
    if (!res.ok) throw new Error('Could not fetch CSV (status ' + res.status + ')');
    const text = await res.text();
    const rows = parseCSV(text);
    chatbotData = rows.map(r => ({
      question: normalizeText(r.question),
      rawQuestion: r.question || '',
      answer: r.answer || ''
    })).filter(r => r.question); // remove empty
    console.log('✅ Chatbot data loaded:', chatbotData.length, 'entries');
  } catch (err) {
    console.error('Error loading chatbot CSV:', err);
    // add fallback generic response so UI still works
    chatbotData = [{
      question: 'what is devbay',
      rawQuestion: 'What is DevBay?',
      answer: 'DevBay Technologies is a global IT company that builds modern digital solutions, software, and automation systems to empower businesses worldwide.'
    }];
  }
}

/* ----------------- Matching logic ----------------- */

/*
  Matching strategy (in order):
  1) Exact normalized equality
  2) Exact substring match (question text in query or query in question)
  3) Token-overlap scoring: overlap / queryTokensLength (and Jaccard)
*/
function findBestAnswer(userInput) {
  const qNorm = normalizeText(userInput);
  if (!qNorm) return null;
  const qTokens = tokenize(qNorm);

  let best = { score: 0, item: null };

  for (const item of chatbotData) {
    const itemQ = item.question;
    if (!itemQ) continue;

    // 1. exact equality
    if (qNorm === itemQ) {
      return item.answer;
    }

    // 2. substring checks
    if (itemQ.includes(qNorm) || qNorm.includes(itemQ)) {
      return item.answer;
    }

    // 3. token overlap scoring
    const itemTokens = tokenize(itemQ);
    if (itemTokens.length === 0) continue;

    const setQ = new Set(qTokens);
    const setI = new Set(itemTokens);
    let intersection = 0;
    for (const t of setQ) if (setI.has(t)) intersection++;

    const overlap = qTokens.length > 0 ? intersection / qTokens.length : 0; // how much of user query matched
    const union = new Set([...setQ, ...setI]).size;
    const jaccard = union > 0 ? intersection / union : 0;

    // combine metrics; favor overlap (matching user tokens)
    const score = (0.7 * overlap) + (0.3 * jaccard);

    if (score > best.score) {
      best = { score, item };
    }
  }

  // threshold: only accept decent matches
  const THRESHOLD = 0.28;
  if (best.score >= THRESHOLD) return best.item.answer;

  // fallback: if we have any item whose question tokens include any single important token (like 'web', 'development') return it
  for (const token of qTokens) {
    if (token.length < 3) continue;
    const hit = chatbotData.find(it => it.question.includes(token));
    if (hit) return hit.answer;
  }

  return null;
}

/* ----------------- UI helpers ----------------- */

function createMessage(text, cls) {
  const div = document.createElement('div');
  div.className = 'message ' + cls;
  div.textContent = text;
  return div;
}

function addUserMessage(text) {
  const box = document.getElementById('chat-box');
  const msg = createMessage(text, 'user');
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

function addBotMessage(text) {
  const box = document.getElementById('chat-box');
  const msg = createMessage(text, 'bot');
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

function showTyping() {
  const box = document.getElementById('chat-box');
  const typing = document.createElement('div');
  typing.className = 'typing';
  typing.id = 'typing-indicator';
  typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  box.appendChild(typing);
  box.scrollTop = box.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

/* ----------------- Event handlers ----------------- */

async function handleSend() {
  const inputEl = document.getElementById('user-input');
  const text = inputEl.value.trim();
  if (!text) return;
  addUserMessage(text);
  inputEl.value = '';
  inputEl.focus();

  showTyping();

  // Slight delay to mimic thinking
  await new Promise(r => setTimeout(r, 450));

  const answer = findBestAnswer(text);

  hideTyping();

  if (answer) {
    addBotMessage(answer);
  } else {
    addBotMessage("🤖 Sorry, I couldn't find an exact answer. Try rephrasing or ask about DevBay's services, locations, or contact info.");
  }
}

function wireUI() {
  // open/close chat
  const icon = document.getElementById('chat-icon');
  const chat = document.getElementById('devbay-chat');
  const closeBtn = document.getElementById('close-chat');

  function showChat() {
    chat.classList.remove('chat-hidden');
    chat.classList.add('chat-visible');
    chat.setAttribute('aria-hidden', 'false');
    document.getElementById('user-input').focus();
  }
  function hideChat() {
    chat.classList.remove('chat-visible');
    chat.classList.add('chat-hidden');
    chat.setAttribute('aria-hidden', 'true');
  }

  let open = false;
  icon.addEventListener('click', () => {
    open = !open;
    if (open) showChat();
    else hideChat();
  });
  closeBtn.addEventListener('click', () => {
    open = false;
    hideChat();
  });

  // send button & enter key
  document.getElementById('send-btn').addEventListener('click', handleSend);
  document.getElementById('user-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  // populate welcome message
  const box = document.getElementById('chat-box');
  box.innerHTML = '';
  addBotMessage("Hi — I'm the DevBay Assistant. Ask me about DevBay (services, locations, contact, CEO, etc.).");
}

/* ----------------- Init ----------------- */

(async function init() {
  await loadChatbotData();
  wireUI();
})();


