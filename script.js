let chatbotData = [];

// Load CSV data
async function loadChatbotData() {
  try {
    const response = await fetch('DevBay_Chatbot_QA.csv');
    const data = await response.text();

    // Split into lines and parse tab-separated or comma-separated
    const rows = data.split('\n').filter(line => line.trim() !== '');
    chatbotData = rows.map(row => {
      const [question, answer] = row.split(/\t|,/); // handles both tab or comma
      return { question: question?.trim().toLowerCase(), answer: answer?.trim() };
    });

    console.log('✅ Chatbot data loaded successfully');
  } catch (error) {
    console.error('Error loading CSV:', error);
  }
}

// Find best match for user input
function findAnswer(userInput) {
  const query = userInput.toLowerCase();

  // Exact match first
  const exactMatch = chatbotData.find(item => query === item.question);
  if (exactMatch) return exactMatch.answer;

  // Partial match next
  const partialMatch = chatbotData.find(item => query.includes(item.question));
  if (partialMatch) return partialMatch.answer;

  return "🤖 Sorry, I didn’t understand that. Please try asking another question about DevBay.";
}

// Add messages to chat
function addMessage(sender, text, className) {
  const chatBox = document.getElementById('chat-box');
  const message = document.createElement('div');
  message.classList.add('message', className);
  message.textContent = text;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Handle send button
document.getElementById('send-btn').addEventListener('click', () => {
  const input = document.getElementById('user-input');
  const userText = input.value.trim();
  if (!userText) return;

  addMessage('user', userText, 'user');
  const botReply = findAnswer(userText);
  setTimeout(() => addMessage('bot', botReply, 'bot'), 500);
  input.value = '';
});

// Allow Enter key to send
document.getElementById('user-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('send-btn').click();
});

// Initialize
loadChatbotData();
