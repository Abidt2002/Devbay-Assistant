// =========================
// DevBay Chatbot - script.js
// =========================

// Load CSV data
let chatbotData = [];

fetch("DevBay_Chatbot_QA.csv")
  .then((response) => response.text())
  .then((csvText) => {
    const lines = csvText.split("\n").filter((l) => l.trim());
    const headers = lines[0].split(",");
    chatbotData = lines.slice(1).map((line) => {
      const values = line.split(",");
      return {
        Category: values[0]?.trim().toLowerCase(),
        Question: values[1]?.trim().toLowerCase(),
        Answer: values[2]?.trim(),
      };
    });
    console.log("✅ Chatbot data loaded:", chatbotData.length, "entries");
  })
  .catch((err) => console.error("⚠️ Error loading CSV:", err));

// =========================
// UI Elements
// =========================
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatIcon = document.getElementById("chat-icon");
const chatContainer = document.getElementById("devbay-chat");
const closeChat = document.getElementById("close-chat");

// =========================
// Open / Close Chat
// =========================
chatIcon.addEventListener("click", () => {
  chatContainer.classList.add("active");
  chatContainer.setAttribute("aria-hidden", "false");
});

closeChat.addEventListener("click", () => {
  chatContainer.classList.remove("active");
  chatContainer.setAttribute("aria-hidden", "true");
});

// =========================
// Message Rendering
// =========================
function appendMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "message user-message" : "message bot-message";
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// =========================
// Typewriter Effect for Bot
// =========================
async function typeMessage(text) {
  const msg = document.createElement("div");
  msg.className = "message bot-message";
  chatBox.appendChild(msg);

  for (let i = 0; i < text.length; i++) {
    msg.textContent += text[i];
    chatBox.scrollTop = chatBox.scrollHeight;
    await new Promise((res) => setTimeout(res, 15));
  }
}

// =========================
// Find Best Answer
// =========================
function findBestAnswer(userInput) {
  const normalized = userInput.toLowerCase().trim();
  let bestMatch = chatbotData.find((row) => normalized.includes(row.Question));
  if (!bestMatch) {
    bestMatch = chatbotData.find((row) => row.Question.includes(normalized));
  }
  return bestMatch ? bestMatch.Answer : "I'm sorry, I don’t have an answer for that yet. Please try another question!";
}

// =========================
// Handle User Input
// =========================
function handleUserInput() {
  const userText = chatInput.value.trim();
  if (!userText) return;

  appendMessage(userText, "user");
  chatInput.value = "";

  setTimeout(async () => {
    const answer = findBestAnswer(userText);
    await typeMessage(answer);
  }, 400);
}

sendBtn.addEventListener("click", handleUserInput);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleUserInput();
});


