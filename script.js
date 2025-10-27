// ============================================================
// DevBay Chatbot — Full Working Script
// Features: CSV Reading, Word-by-Word Typing, Auto Scroll
// ============================================================

// ------------------------------
// Utility: Normalize text for matching
// ------------------------------
function normalizeText(text) {
  return text.toLowerCase().replace(/[^\w\s]/gi, "").trim();
}

// ------------------------------
// Load CSV Data
// ------------------------------
let qaData = [];

async function loadCSV() {
  try {
    const response = await fetch("DevBay_Chatbot_QA.csv");
    const csvText = await response.text();
    const lines = csvText.split("\n").slice(1); // skip header row
    qaData = lines
      .map(line => {
        const [question, answer] = line.split(/,(.+)/); // split only on first comma
        if (question && answer) {
          return { question: normalizeText(question), answer: answer.trim() };
        }
        return null;
      })
      .filter(Boolean);
    console.log("✅ CSV loaded:", qaData.length, "QA pairs");
  } catch (err) {
    console.error("❌ Error loading CSV:", err);
  }
}

// ------------------------------
// DOM Elements
// ------------------------------
const chatIcon = document.getElementById("chat-icon");
const chatBox = document.getElementById("chat-box");
const chatWindow = document.getElementById("devbay-chat");
const closeChat = document.getElementById("close-chat");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// ------------------------------
// Chat Toggle
// ------------------------------
chatIcon.addEventListener("click", () => {
  chatWindow.classList.toggle("chat-visible");
  chatWindow.classList.toggle("chat-hidden");
  chatWindow.setAttribute(
    "aria-hidden",
    chatWindow.classList.contains("chat-hidden")
  );
});

closeChat.addEventListener("click", () => {
  chatWindow.classList.remove("chat-visible");
  chatWindow.classList.add("chat-hidden");
});

// ------------------------------
// Send Message Handler
// ------------------------------
sendBtn.addEventListener("click", handleUserMessage);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") handleUserMessage();
});

async function handleUserMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, "user");
  userInput.value = "";
  await respondToUser(text);
}

// ------------------------------
// Add Message to Chat
// ------------------------------
function addMessage(content, sender) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = content;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

// ------------------------------
// Bot Typing Animation
// ------------------------------
async function respondToUser(userText) {
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;

  await new Promise(r => setTimeout(r, 700)); // simulate typing
  typing.remove();

  const response = findBestAnswer(userText);
  await typeResponse(response);
}

// ------------------------------
// Find Best Answer
// ------------------------------
function findBestAnswer(userText) {
  const input = normalizeText(userText);
  let bestMatch = null;
  let bestScore = 0;

  qaData.forEach(({ question, answer }) => {
    let score = 0;
    if (question.includes(input) || input.includes(question)) {
      score = 1;
    } else {
      // Fuzzy partial match by word overlap
      const inputWords = input.split(" ");
      const questionWords = question.split(" ");
      const matches = inputWords.filter(w => questionWords.includes(w)).length;
      score = matches / Math.max(questionWords.length, inputWords.length);
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = answer;
    }
  });

  if (bestScore < 0.2)
    return "I'm not sure about that — please try asking in a different way or contact us at info@devbay.ai";
  return bestMatch;
}

// ------------------------------
// Type Response Word-by-Word
// ------------------------------
async function typeResponse(text) {
  const msg = document.createElement("div");
  msg.className = "message bot";
  chatBox.appendChild(msg);

  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    const span = document.createElement("span");
    span.textContent = words[i] + " ";
    msg.appendChild(span);
    await new Promise(r => setTimeout(r, 40)); // typing delay
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// ------------------------------
// Initialize
// ------------------------------
window.addEventListener("DOMContentLoaded", loadCSV);


