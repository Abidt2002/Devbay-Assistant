// ========================
// DevBay Chatbot Script (Fixed & Optimized)
// ========================

document.addEventListener("DOMContentLoaded", () => {
  // Store chatbot dataset
  let chatbotData = [];

  // Load CSV data
  fetch("chatbot_data.csv")
    .then(res => res.text())
    .then(data => {
      const rows = data.split("\n").slice(1); // skip header
      rows.forEach(row => {
        const [category, question, answer] = row.split(",");
        if (question && answer) {
          chatbotData.push({
            question: question.trim().toLowerCase(),
            answer: answer.trim()
          });
        }
      });
      console.log("✅ Chatbot CSV loaded:", chatbotData.length, "entries");
    })
    .catch(err => console.error("❌ Error loading CSV:", err));

  // DOM elements
  const chatIcon = document.getElementById("chat-icon");
  const chatContainer = document.getElementById("devbay-chat");
  const closeChat = document.getElementById("close-chat");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  // ========================
  // Toggle chat visibility
  // ========================
  chatIcon.addEventListener("click", () => {
    chatContainer.classList.remove("chat-hidden");
    chatContainer.classList.add("chat-visible");
    chatContainer.setAttribute("aria-hidden", "false");
  });

  closeChat.addEventListener("click", () => {
    chatContainer.classList.add("chat-hidden");
    chatContainer.classList.remove("chat-visible");
    chatContainer.setAttribute("aria-hidden", "true");
  });

  // ========================
  // Send Message Logic
  // ========================
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

  // ========================
  // Response Logic
  // ========================
  function getBotResponse(userMessage) {
    const lower = userMessage.toLowerCase();
    const match = chatbotData.find(item => lower.includes(item.question));
    return match ? match.answer : "I'm not sure about that — could you rephrase?";
  }

  // ========================
  // Add Message to Chat
  // ========================
  function addMessage(sender, text) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${sender}`;
    messageEl.textContent = text;
    chatBox.appendChild(messageEl);
    scrollUpSmooth();
  }

  // ========================
  // Typing Indicator
  // ========================
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

  // ========================
  // Word-by-Word Typing Effect
  // ========================
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
    }, 80);
  }

  // ========================
  // Auto Scroll Animation
  // ========================
  function scrollUpSmooth() {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: "smooth"
    });
  }

  // ========================
  // Welcome Message
  // ========================
  setTimeout(() => {
    addMessage("bot", "👋 Hello! I’m the DevBay Assistant — how can I help you today?");
  }, 600);
});


