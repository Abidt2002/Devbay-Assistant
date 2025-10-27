let qaPairs = [];

// ✅ Load CSV file dynamically
fetch("DevBay_Chatbot_QA.csv")
  .then(res => res.text())
  .then(data => {
    qaPairs = parseCSV(data);
    console.log("✅ CSV Loaded:", qaPairs.length, "entries");
  })
  .catch(err => console.error("❌ Error loading CSV:", err));

// ==============================
// CSV Parser (Simple + Reliable)
// ==============================
function parseCSV(str) {
  const rows = str.split(/\r?\n/).filter(line => line.trim() !== "");
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const match = rows[i].match(/^(.*?),(.*)$/);
    if (match) {
      const question = match[1].replace(/^"|"$/g, "").trim().toLowerCase();
      const answer = match[2].replace(/^"|"$/g, "").trim();
      result.push({ question, answer });
    }
  }
  return result;
}

// ==============================
// Chat Logic
// ==============================
function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const userText = input.value.trim();

  if (!userText) return;

  // Add user message
  const userDiv = document.createElement("div");
  userDiv.className = "user-message";
  userDiv.textContent = userText;
  chatBox.appendChild(userDiv);

  input.value = "";

  // Get bot response
  const response = findBestMatch(userText.toLowerCase());
  const botDiv = document.createElement("div");
  botDiv.className = "bot-message";
  botDiv.textContent = response;
  chatBox.appendChild(botDiv);

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ==============================
// Answer Finder (Fuzzy Matching)
// ==============================
function findBestMatch(userQuestion) {
  if (!qaPairs.length) return "Please wait... loading data ⏳";

  let bestMatch = null;
  let highestScore = 0;

  for (const { question, answer } of qaPairs) {
    const score = similarity(userQuestion, question);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = answer;
    }
  }

  if (highestScore > 0.4) {
    return bestMatch;
  } else {
    return "🤖 Sorry, I couldn’t find an answer for that. Try rephrasing!";
  }
}

// ==============================
// String Similarity (Jaccard)
// ==============================
function similarity(a, b) {
  const aWords = new Set(a.split(/\s+/));
  const bWords = new Set(b.split(/\s+/));
  const intersection = new Set([...aWords].filter(x => bWords.has(x)));
  const union = new Set([...aWords, ...bWords]);
  return intersection.size / union.size;
}

