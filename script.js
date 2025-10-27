// ============================================================
// DevBay Assistant - Chatbot Script
// Reads Q&A pairs from DevBay_Chatbot_QA.csv and replies smartly
// ============================================================

let qaData = [];

// Load CSV data
async function loadCSV() {
  try {
    const response = await fetch("DevBay_Chatbot_QA.csv");
    const text = await response.text();

    // Split rows by new line
    const rows = text.split(/\r?\n/);
    const header = rows.shift(); // remove first line (Question,Answer)

    rows.forEach(row => {
      const [q, a] = row.split(/,(.+)/); // split only on first comma
      if (q && a) qaData.push({
        question: q.trim().replace(/^"|"$/g, ''),
        answer: a.trim().replace(/^"|"$/g, '')
      });
    });

    console.log(`✅ CSV Loaded: ${qaData.length} Q&A pairs`);
  } catch (err) {
    console.error("❌ Error loading CSV:", err);
  }
}

// Normalize text for fuzzy matching
function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/gi, "").trim();
}

// Find best matching answer
function findAnswer(input) {
  const query = normalize(input);
  let bestMatch = null;
  let bestScore = 0;

  qaData.forEach(qa => {
    const qNorm = normalize(qa.question);
    const score = similarity(query, qNorm);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = qa;
    }
  });

  if (bestMatch && bestScore > 0.3) return bestMatch.answer;
  return "🤔 Sorry, I couldn’t find an answer for that. Try rephrasing your question.";
}

// Simple similarity scoring
function similarity(a, b) {
  const aWords = a.split(" ");
  const bWords = b.split(" ");
  const matchCount = aWords.filter(w => bWords.includes(w)).length;
  return matchCount / Math.max(aWords.length, bWords.length);
}

// ===============================
// Chat UI Logic
// ===============================
const chatIcon = document.getElementById("chat-icon");
const chatContainer = document.getElementById("devbay-chat");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const closeChat = document.getElementById("close-chat");

// Toggle chat open/close
chatIcon.onclick = () => {
  const isHidden = chatContainer.classList.contains("chat-hidden");
  chatContainer.classList.toggle("chat-hidden", !isHidden);
  chatContainer.classList.toggle("chat-visible", isHidden);
  chatContainer.setAttribute("aria-hidden", !isHidden ? "true" : "false");

  if (isHidden && chatBox.childElementCount === 0) {
    setTimeout(() => {
      typeBotMessage("👋 Hello! I’m DevBay Assistant. Ask me anything about our company, services, or contact info.");
    }, 300);
  }
};

closeChat.onclick = () => {
  chatContainer.classList.remove("chat-visible");
  chatContainer.classList.add("chat-hidden");
  chatContainer.setAttribute("aria-hidden", "true");
};

// Send button or Enter key
sendBtn.onclick = sendMessage;
chatInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

// Handle message sending
function sendMessage() {
  const userMsg = chatInput.value.trim();
  if (!userMsg) return;

  appendMessage("user", userMsg);
  chatInput.value = "";

  // Typing indicator
  const typingDiv = showTyping();
  chatBox.scrollTop = chatBox.scrollHeight;

  setTimeout(() => {
    typingDiv.remove();
    const answer = findAnswer(userMsg);
    typeBotMessage(answer);
  }, 800);
}

// Append message to chat
function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender === "user" ? "user" : "bot");
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Bot typing animation
async function typeBotMessage(text) {
  const div = document.createElement("div");
  div.classList.add("message", "bot");
  chatBox.appendChild(div);

  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    div.innerHTML += words[i] + " ";
    chatBox.scrollTop = chatBox.scrollHeight;
    await new Promise(r => setTimeout(r, 40));
  }
}

// Typing indicator
function showTyping() {
  const div = document.createElement("div");
  div.classList.add("typing");
  div.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

// Initialize
loadCSV();
