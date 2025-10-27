document.addEventListener("DOMContentLoaded", () => {
  const CSV_FILENAME = "DevBay_Chatbot_QA.csv";
  let qaData = [];

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

  // Utilities
  function normalizeText(s) {
    return (s || "").toLowerCase().replace(/[\u2018\u2019\u201c\u201d]/g, "'").replace(/[^\w\s']/g, " ").replace(/\s+/g, " ").trim();
  }
  function escapeHtml(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  // CSV parser
  function parseCSV(text) {
    const rows = [];
    let cur = "", inQuotes = false, col = [];
    for (let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='"' && text[i+1]==='"'){cur+='"'; i++; continue;}
      if(ch==='"'){inQuotes=!inQuotes; continue;}
      if(ch===',' && !inQuotes){col.push(cur); cur=""; continue;}
      if((ch==='\n'||ch==='\r')&&!inQuotes){
        if(cur!==""||col.length){col.push(cur); rows.push(col); col=[]; cur="";}
        if(ch==='r' && text[i+1]==='\n'){i++;}
        continue;
      }
      cur+=ch;
    }
    if(cur!==""||col.length){col.push(cur); rows.push(col);}
    return rows;
  }

  function processCsvText(text){
    const rows=parseCSV(text); qaData=[];
    if(rows.length===0) return;
    const header=rows[0].map(h=>(h||"").toString().toLowerCase());
    let qIdx=header.findIndex(h=>h.includes("question"));
    let aIdx=header.findIndex(h=>h.includes("answer")||h.includes("response"));
    if(qIdx===-1||aIdx===-1){qIdx=0;aIdx=1;}
    for(let i=1;i<rows.length;i++){
      const r=rows[i]; if(!r) continue;
      const rawQ=(r[qIdx]||"").trim(), rawA=(r[aIdx]||"").trim();
      if(rawQ||rawA){qaData.push({ rawQuestion:rawQ, question:normalizeText(rawQ), answer:rawA });}
    }
  }

  // Fetch CSV from server
  async function tryFetchCsv(){
    try{
      const res=await fetch(CSV_FILENAME,{cache:"no-store"});
      if(!res.ok) throw new Error("no csv");
      const text=await res.text();
      processCsvText(text);
      statusEl.textContent=`Loaded ${qaData.length} Q&A from ${CSV_FILENAME}`;
    }catch(e){
      console.warn("Fetch CSV failed:", e);
      statusEl.textContent=`CSV not loaded — click Upload CSV or host files on a server.`;
    }
  }

  // CSV upload
  uploadBtn.addEventListener("click", ()=>fileInput.click());
  fileInput.addEventListener("change",(ev)=>{
    const f=ev.target.files[0]; if(!f) return;
    statusEl.textContent=`Loading ${f.name} ...`;
    const reader=new FileReader();
    reader.onload=()=>{ processCsvText(String(reader.result)); statusEl.textContent=`Loaded ${qaData.length} entries from ${f.name}`; openChat(); };
    reader.onerror=(e)=>{ statusEl.textContent="Failed to read file"; console.error(e); };
    reader.readAsText(f,"utf-8");
  });

  // Open/close chat with animations
  function openChat(){
    chatContainer.classList.remove("chat-hidden");
    chatContainer.classList.add("chat-visible");
    chatContainer.style.transform="translateY(0)";
    chatContainer.setAttribute("aria-hidden","false");
    userInput.focus();
    if(chatBox.children.length===0){
      typeBotMessage("👋 Hi — I'm the DevBay Assistant. Ask me about DevBay (services, location, contact).");
    }
  }
  function closeChat(){
    chatContainer.style.transform="translateY(200px)";
    chatContainer.classList.remove("chat-visible");
    chatContainer.classList.add("chat-hidden");
    chatContainer.setAttribute("aria-hidden","true");
  }
  chatIcon.addEventListener("click", openChat);
  closeBtn.addEventListener("click", closeChat);

  // Messages
  function addUserMessage(text){ const d=document.createElement("div"); d.className="message user"; d.textContent=text; chatBox.appendChild(d); chatBox.scrollTop=chatBox.scrollHeight; }
  function addBotMessage(text){ const d=document.createElement("div"); d.className="message bot"; d.textContent=text; chatBox.appendChild(d); chatBox.scrollTop=chatBox.scrollHeight; }

  // Typing indicator
  function showTyping(){ const t=document.createElement("div"); t.className="typing"; t.id="__typing"; t.innerHTML='<span class="dot"></span><span class="dot"></span><span class="dot"></span>'; chatBox.appendChild(t); chatBox.scrollTop=chatBox.scrollHeight; return t; }
  function hideTyping(){ const t=document.getElementById("__typing"); if(t) t.remove(); }

  // Find best answer
  function findBestAnswer(inputText){
    const q=normalizeText(inputText); if(!q) return null;
    const exact=qaData.find(it=>it.question===q); if(exact) return exact.answer;
    const substring=qaData.find(it=>it.question&&(it.question.includes(q)||q.includes(it.question))); if(substring) return substring.answer;
    const qTokens=q.split(" ").filter(Boolean); let best={score:0,answer:null};
    for(const it of qaData){
      const itTokens=(it.question||"").split(" ").filter(Boolean); if(itTokens.length===0) continue;
      let overlap=0; for(const t of qTokens) if(itTokens.includes(t)) overlap++;
      const score=overlap/Math.max(qTokens.length,itTokens.length); if(score>best.score) best={score,answer:it.answer};
    }
    if(best.score>=0.28) return best.answer;
    for(const tk of qTokens){ if(tk.length<3) continue; const hit=qaData.find(it=>(it.question||"").includes(tk)); if(hit) return hit.answer; }
    return null;
  }

  // Word-by-word typing
  async function typeBotMessage(text){
    const msg=document.createElement("div"); msg.className="message bot"; chatBox.appendChild(msg);
    chatBox.scrollTop=chatBox.scrollHeight;
    const words=text.split(" ");
    for(let i=0;i<words.length;i++){
      msg.innerHTML+=(i===0?"":" ")+escapeHtml(words[i]);
      chatBox.scrollTop=chatBox.scrollHeight;
      await new Promise(r=>setTimeout(r,40));
    }
  }

  // Send handler
  async function handleSend(){
    const text=userInput.value.trim(); if(!text) return;
    addUserMessage(text);
    userInput.value="";
    const typing=showTyping();
    await new Promise(r=>setTimeout(r,400));
    hideTyping();
    const ans=findBestAnswer(text);
    if(!ans){ await typeBotMessage("🤖 Sorry, I couldn't find a matching answer. Try rephrasing or upload the CSV."); return; }
    await typeBotMessage(ans);
  }

  sendBtn.addEventListener("click",handleSend);
  userInput.addEventListener("keydown",(e)=>{if(e.key==="Enter") handleSend();});

  // try fetch CSV
  tryFetchCsv();

  // debug
  window.__devbay={qaData,parseCSV,processCsvText};
});
