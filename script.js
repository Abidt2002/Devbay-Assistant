let qaData = [];

// Load CSV data
fetch('DevBay_Chatbot_QA.csv')
  .then(response => response.text())
  .then(text => {
    const lines = text.split('\n').slice(1); // Skip header row
    qaData = lines.map(line => {
      const [question, answer] = line.split(/,(.+)/); // Split only first comma
      return {
        question: question?.trim()?.toLowerCase(),
        answer: answer?.replace(/^"|"$/g, '').trim()
      };
    });
    console.log("✅ CSV loaded:", qaData.length, "entries");
  })
  .catch(err => console.error("❌ Error loading CSV:", err));

function sendMessage() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const userText = input.value.trim();
  if (!userText) return;

  // Add user message
  const userMsg = document.createElement('div');
  userMsg.className = 'user-message';
  userMsg.textContent = userText;
  chatBox.appendChild(userMsg);
  input.value = '';

  // Find best match
  const reply = findAnswer(userText);

  // Add bot message
  const botMsg = document.createElement('div');
  botMsg.className = 'bot-message';
  botMsg.textContent = reply;
  chatBox.appendChild(botMsg);

  chatBox.scrollTop = chatBox.scrollHeight;
}

function findAnswer(userInput) {
  userInput = userInput.toLowerCase();
  let bestMatch = qaData.find(item => userInput.includes(item.question));
  if (!bestMatch) {
    bestMatch = qaData.find(item => item.question && item.question.includes(userInput));
  }
  return bestMatch ? bestMatch.answer : "🤖 Sorry, I couldn’t find an answer for that. Try asking differently.";
}

