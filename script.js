// robust script.js — handles fetch, parsing, upload fallback, typing + matching

document.addEventListener("DOMContentLoaded", () => {
  const CSV_FILENAME = "DevBay_Chatbot_QA.csv";
  let qaData = []; // { question: string (normalized), rawQuestion, answer }

  // DOM
  const statusEl = document.getElementById("status");
  const uploadBtn = document.getElementById("upload-btn");
  const fileInput = document.getElementById("csv-file");
  const chatIcon = document.getElementById("chat-icon");
  const chatContainer = document.getElementById("devbay-chat");
  const closeBtn = document.getElementById("close-chat");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  // helpful utilities
  function normalizeText(s) {
    return (s || "").toLowerCase().replace(/[\u2018\u2019\u201c\u201d]/g, "'").replace(/[^\w\s']/g, " ").replace(/\s+/g, " ").trim();
  }

  // Robust CSV parser: handles quoted fields with commas & newlines
  function parseCSV(text) {
    const rows = [];
    let cur = "";
    let inQuotes = false;
    let col = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"' && text[i+1] === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { col.push(cur); cur = ""; continue; }
      if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (cur !== "" || col.length) {
          col.push(cur);
          rows.push(col);
          col = [];
          cur = "";
        }
        // handle \r\n by skipping next \n if present
        if (ch === '\r' && text[i+1] === '\n') { i++; }
        continue;
      }
      cur += ch;
    }
    if (cur !== "" || col.length) { col.push(cur); rows.push(col); }
    return rows;
  }

  // load CSV from same-folder file (works on server)
  async function tryFetchCsv() {
    try {
      const res = await fetch(CSV_FILENAME, {cache: "no-store"});
      if (!res.ok) throw new Error("no csv");
      const text = await res.text();
      processCsvText(text);
      statusEl.textContent = `Loaded ${qaData.length} Q&A from ${CSV_FILENAME}`;
    } catch (e) {
      console.warn("Fetch CSV failed:", e);
      statusEl.textContent = `CSV not loaded — click Upload CSV or host files on a server.`;
    }
  }

  // process CSV text into qaData
  function processCsvText(text) {
    const rows = parseCSV(text);
    qaData = [];
    // find header row and column positions (flexible)
    if (rows.length === 0) return;
    const header = rows[0].map(h => (h||"").toString().toLowerCase());
    let qIdx = header.findIndex(h => h.includes("question"));
    let aIdx = header.findIndex(h => h.includes("answer") || h.includes("response"));
    if (qIdx === -1 || aIdx === -1) {
      // fallback: assume first two columns are question,answer
      qIdx = 0; aIdx = 1;
    }
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const rawQ = (r[qIdx] || "").toString().trim();
      const rawA = (r[aIdx] || "").toString().trim();
      if (rawQ || rawA) {
        qaData.push({
          rawQuestion: rawQ,
          question: normalizeText(rawQ),
          answer: rawA
        });
      }
    }
  }

  // upload handler (local file)
  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    statusEl.textContent = `Loading ${f.name} ...`;
    const reader = new FileReader();
    reader.onload = () => {
      processCsvText(String(reader.result));
      statusEl.textContent = `Loaded ${qaData.length} entries from ${f.name}`;
      // optionally open the chat on load
      openChat();
    };
    reader.onerror = (e) => {
      statusEl.textContent = "Failed to read file";
      console.error(e);
    };
    reader.readAsText(f, "utf-8");
  });

  // open/close chat
  function openChat() {
    chatContainer.classList.remove("chat-hidden");
    chatContainer.classList.add("chat-visible");
    chatContainer.setAttribute("aria-hidden", "false");
    userInput.focus();
    if (chatBox.children.length === 0) {
      addBotMessage("👋 Hi — I'm the DevBay Assistant. Ask me about DevBay (services, location, contact).");
    }
  }
  function closeChat() {
    chatContainer.classList.remove("chat-visible");
    chatContainer.classList.add("chat-hidden");
    chatContainer.setAttribute("aria-hidden", "true");
  }
  chatIcon.addEventListener("click", openChat);
  closeBtn.addEventListener("click", closeChat);

  // UI helpers
  function addUserMessage(text) {
    const d = document.createElement("div"); d.className = "message user"; d.textContent = text;
    chatBox.appendChild(d); chatBox.scrollTop = chatBox.scrollHeight;
  }
  function addBotMessage(text) {
    const d = document.createElement("div"); d.className = "message bot"; d.textContent = text;
    chatBox.appendChild(d); chatBox.scrollTop = chatBox.scrollHeight;
  }

  // typing indicator
  function showTyping() {
    const t = document.createElement("div"); t.className = "typing"; t.id = "__typing";
    t.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatBox.appendChild(t); chatBox.scrollTop = chatBox.scrollHeight;
    return t;
  }
  function hideTyping() { const t = document.getElementById("__typing"); if (t) t.remove(); }

  // matching logic: normalized token overlap + exacts
  function findBestAnswer(inputText) {
    const q = normalizeText(inputText);
    if (!q) return null;
    // exact & substring first
    const exact = qaData.find(it => it.question === q);
    if (exact) return exact.answer;
    const substring = qaData.find(it => it.question && (it.question.includes(q) || q.includes(it.question)));
    if (substring) return substring.answer;

    // token overlap scoring
    const qTokens = q.split(" ").filter(Boolean);
    let best = { score: 0, answer: null };
    for (const it of qaData) {
      const itTokens = (it.question || "").split(" ").filter(Boolean);
      if (itTokens.length === 0) continue;
      let overlap = 0;
      for (const t of qTokens) if (itTokens.includes(t)) overlap++;
      const score = overlap / Math.max(qTokens.length, itTokens.length);
      if (score > best.score) best = { score, answer: it.answer };
    }
    if (best.score >= 0.28) return best.answer;

    // fallback: find by single important token
    for (const tk of qTokens) {
      if (tk.length < 3) continue;
      const hit = qaData.find(it => (it.question || "").includes(tk));
      if (hit) return hit.answer;
    }

    return null;
  }

  // send handler + typing effect (word-by-word)
  async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;
    addUserMessage(text);
    userInput.value = "";
    const typing = showTyping();

    // small delay to simulate thinking
    await new Promise(r => setTimeout(r, 450));
    hideTyping();

    const ans = findBestAnswer(text);
    if (!ans) {
      addBotMessage("🤖 Sorry, I couldn't find a matching answer. Try rephrasing or upload the CSV.");
      return;
    }

    // type word-by-word
    const msg = document.createElement("div"); msg.className = "message bot"; chatBox.appendChild(msg);
    const words = ans.split(" ");
    for (let i = 0; i < words.length; i++) {
      msg.innerHTML += (i === 0 ? "" : " ") + escapeHtml(words[i]);
      chatBox.scrollTop = chatBox.scrollHeight;
      await new Promise(r => setTimeout(r, 40));
    }
  }

  // escape helper
  function escapeHtml(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  // wire send UI
  sendBtn.addEventListener("click", handleSend);
  userInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSend(); });

  // try fetch CSV automatically (works if hosted)
  tryFetchCsv();

  // expose for debugging
  window.__devbay = { qaData, parseCSV, processCsvText };
});
