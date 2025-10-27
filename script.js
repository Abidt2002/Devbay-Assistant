document.addEventListener("DOMContentLoaded", () => {
  const CSV_FILENAME = "DevBay_Chatbot_QA.csv"; // CSV file in the same directory
  let qaData = [];

  // DOM
  const chatIcon = document.getElementById("chat-icon");
  const chatContainer = document.getElementById("devbay-chat");
  const closeBtn = document.getElementById("close-chat");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  const normalize = s => (s||"").toLowerCase().trim();

  // Chat open/close
  const openChat = () => {
    chatContainer.classList.add("chat-visible");
    userInput.focus();
    if(chatBox.children.length===0) typeBot("👋 Hi — I'm the DevBay Assistant. Ask me anything about DevBay!");
  };
  const closeChat = () => chatContainer.classList.remove("chat-visible");
  chatIcon.addEventListener("click", openChat);
  closeBtn.addEventListener("click", closeChat);

  // fetch CSV automatically
  async function loadCsv() {
    try {
      const res = await fetch(CSV_FILENAME, {cache:"no-store"});
      if(!res.ok) throw new Error("CSV not found");
      const text = await res.text();
      parseCSV(text);
    } catch(e) {
      console.error("Failed to load CSV:", e);
      typeBot("⚠️ Failed to load Q&A data from CSV.");
    }
  }

  function parseCSV(text){
    const rows = text.split(/\r?\n/).map(r=>r.split(","));
    // assume first row is header
    qaData = rows.slice(1).map(r=>{
      return { question: normalize(r[0]), answer: r[1] || "" };
    });
  }

  function findAnswer(q){
    q = normalize(q);
    const exact = qaData.find(e=>e.question===q);
    if(exact) return exact.answer;
    return "🤖 Sorry, I couldn't find a matching answer. Try rephrasing your question.";
  }

  async function typeBot(text){
    const msg = document.createElement("div"); msg.className="message bot"; chatBox.appendChild(msg);
    const words = text.split(" ");
    for(let w of words){
      msg.innerHTML += (msg.innerHTML?" ":"")+w;
      chatBox.scrollTop = chatBox.scrollHeight;
      await new Promise(r=>setTimeout(r,50));
    }
  }

  async function handleSend(){
    const text = userInput.value.trim(); if(!text) return;
    const userMsg = document.createElement("div"); userMsg.className="message user"; userMsg.textContent=text;
    chatBox.appendChild(userMsg); chatBox.scrollTop=chatBox.scrollHeight;
    userInput.value="";
    const ans = findAnswer(text);
    await typeBot(ans);
  }

  sendBtn.addEventListener("click", handleSend);
  userInput.addEventListener("keydown", e=>{ if(e.key==="Enter") handleSend(); });

  // load CSV automatically
  loadCsv();
});
