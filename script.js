fetch("DevBay_Chatbot_QA.csv")

// ============================================================
// DevBay Chatbot Script (Optimized for Smooth Scroll + Word Animation)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  let chatbotData = [];

  // ========================
  // Load CSV Data
  // ========================
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
      console.log(`✅ Chatbot CSV loaded: ${chatbotData.length} entries`);
    })
    .catch(err => console.error("❌ Error loading CSV:", err));

  // ========================
  // DOM Elements
  // ========================
  const chatIcon = document.getElementById("chat-icon");
  const chatContainer = document.getElementById("devbay-chat");
  const closeChat = document.getElementById("close-chat");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  // ========================
  // Toggle Chat Visibility
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
  // Get Bot Response
  // ========================
  function getBotResponse(userMessage) {
    const lower = userMessage.toLowerCase();

    // Find best match (simple fuzzy match)
    const match = chatbotData.find(item => lower.includes(item.question));

    // Dynamic polite fallback
    const fallbackReplies = [
      "I'm not sure about that — could you rephrase it a bit?",
      "Hmm, I don’t have an answer for that yet — want to ask differently?",
      "Could you clarify what you mean?",
      "Sorry, I’m still learning — can you try rewording that?"
    ];

    return match
      ? match.answer
      : fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  }

  // ========================
  // Add User Message
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
  // Word-by-Word Typing Effect (with span animation)
  // ========================
  function typeMessage(text) {
    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    chatBox.appendChild(botMsg);

    const words = text.split(" ");
    let index = 0;

    const interval = setInterval(() => {
      if (index < words.length) {
        const span = document.createElement("span");
        span.textContent = (index === 0 ? "" : " ") + words[index];
        botMsg.appendChild(span);
        scrollUpSmooth();
        index++;
      } else {
        clearInterval(interval);
      }
    }, 80);
  }

  // ========================
  // Smooth Scroll Animation
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
    typeMessage("👋 Hello! I’m the DevBay Assistant — how can I help you today?");
  }, 600);
});


