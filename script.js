// ========================
// DevBay Chatbot Script — Fixed for Proper CSV Matching
// ========================

document.addEventListener("DOMContentLoaded", () => {
  let chatbotData = [];

  // Load CSV file
  fetch("DevBay_Chatbot_QA.csv")
    .then(res => res.text())
    .then(data => {
      const rows = data.split("\n").slice(1); // skip header
      rows.forEach(row => {
        const [question, ...answerParts] = row.split(",");
        const answer = answerParts.join(",").trim().replace(/^"|"$/g, ""); // fix quotes
        if (question && answer) {
          chatbotData.push({
            question: question.trim().toLowerCase(),
            answer: answer
          });
        }
      });
      console.log("✅ Chatbot data loaded:", chatbotData.length, "entries");
    })
    .catch(err => console.error("❌ Error loading CSV:", err));

  // DOM elements
  const chatIcon = document.getElementById("chat-icon");
  const chatContainer = document.getElementById("chat-container");
  const closeChat = document.getElementById("close-chat");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  // Open/Close chat
  chatIcon.addEventListener("click", () => {
    chatContainer.classList.toggle("chat-hidden");
    chatContainer.classList.toggle("chat-visible");
  });

  closeChat.addEventListener("click", () => {
    chatContainer.classList.add("chat-hidden");
    chatContainer.classList.remove("chat-visible");
  });

  // Send message events
  sendBtn.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

  // ========== SEND MESSAGE ==========
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
    }, 800);
  }

  // ========== GET BOT RESPONSE ==========
  function getBotResponse(userMessage) {
    const lower = userMessage.toLowerCase();

    // Fuzzy search — best matching question
    let bestMatch = null;
    let bestScore = 0;

    chatbotData.forEach(item => {
      let score = 0;
      const qWords = item.question.split(" ");
      qWords.forEach(word => {
        if (lower.includes(word)) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    });

    if (bestMatch && bestScore > 0) {
      return bestMatch.answer;
    }

    return "🤔 I’m not sure about that. Try asking differently, e.g. 'What services Devbay provide?'.";
  }

  // ========== DISPLAY MESSAGES ==========
  function addMessage(sender, text) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${sender}`;
    messageEl.textContent = text;
    chatBox.appendChild(messageEl);
    scrollUpSmooth();
  }

  // Typing animation
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

  // Word-by-word typing effect
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
    }, 60);
  }

  // Smooth auto-scroll up
  function scrollUpSmooth() {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: "smooth"
    });
  }

  // Welcome message
  setTimeout(() => {
    addMessage("bot", "👋 Hello! I’m the DevBay Assistant — how can I help you today?");
  }, 800);
});


