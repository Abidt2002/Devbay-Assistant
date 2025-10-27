// ========================
// DevBay Chatbot Script — Accurate Response Version
// ========================

document.addEventListener("DOMContentLoaded", () => {
  let chatbotData = [];

  // ========== Load CSV Data ==========
  fetch("DevBay_Chatbot_QA.csv")
    .then(res => res.text())
    .then(data => {
      const lines = data.split(/\r?\n/).filter(line => line.trim());
      const headers = lines.shift(); // remove header row
      lines.forEach(line => {
        // handle commas inside quotes
        const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (match && match.length >= 2) {
          const question = match[0].replace(/^"|"$/g, "").trim().toLowerCase();
          const answer = match.slice(1).join(",").replace(/^"|"$/g, "").trim();
          chatbotData.push({ question, answer });
        }
      });
      console.log("✅ Loaded", chatbotData.length, "QA entries");
    })
    .catch(err => console.error("❌ Error loading CSV:", err));

  // ========== DOM Elements ==========
  const chatIcon = document.getElementById("chat-icon");
  const chatContainer = document.getElementById("chat-container");
  const closeChat = document.getElementById("close-chat");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  // ========== Chat Visibility ==========
  chatIcon.addEventListener("click", () => {
    chatContainer.classList.toggle("chat-hidden");
    chatContainer.classList.toggle("chat-visible");
  });

  closeChat.addEventListener("click", () => {
    chatContainer.classList.add("chat-hidden");
    chatContainer.classList.remove("chat-visible");
  });

  // ========== Message Sending ==========
  sendBtn.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

  function sendMessage() {
    const msg = userInput.value.trim();
    if (!msg) return;
    addMessage("user", msg);
    userInput.value = "";
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();
      const reply = getBotResponse(msg);
      typeMessage(reply);
    }, 700);
  }

  // ========== Intelligent Matching ==========
  function getBotResponse(userMessage) {
    const lower = userMessage.toLowerCase();

    // 1️⃣ Exact match
    let found = chatbotData.find(item => item.question === lower);
    if (found) return found.answer;

    // 2️⃣ Partial match
    found = chatbotData.find(item => lower.includes(item.question));
    if (found) return found.answer;

    // 3️⃣ Fuzzy matching (word overlap)
    let bestMatch = null;
    let bestScore = 0;
    chatbotData.forEach(item => {
      const words = item.question.split(/\s+/);
      let score = 0;
      words.forEach(w => {
        if (lower.includes(w)) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    });

    if (bestMatch && bestScore > 0) return bestMatch.answer;
    return "🤔 I’m not sure about that — try asking, e.g., 'What is Devbay?' or 'Where is Devbay located?'.";
  }

  // ========== Display Messages ==========
  function addMessage(sender, text) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${sender}`;
    messageEl.textContent = text;
    chatBox.appendChild(messageEl);
    scrollUpSmooth();
  }

  // Typing Indicator
  function showTypingIndicator() {
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.id = "typing";
    typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatBox.appendChild(typing);
    scrollUpSmooth();
  }
  function removeTypingIndicator() {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();
  }

  // Word-by-word Typing
  function typeMessage(text) {
    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    chatBox.appendChild(botMsg);

    const words = text.split(" ");
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        botMsg.textContent += (i === 0 ? "" : " ") + words[i];
        scrollUpSmooth();
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);
  }

  // Scroll Animation
  function scrollUpSmooth() {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: "smooth"
    });
  }

  // Welcome Message
  setTimeout(() => {
    addMessage("bot", "👋 Hello! I’m the DevBay Assistant — ask me anything about DevBay or our services.");
  }, 700);
});


