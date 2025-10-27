let qaData = [];

// Load CSV file
fetch('Devbay_Chatbot_QA.csv')
  .then(res => res.text())
  .then(text => {
    const rows = text.split('\n').map(r => r.split(','));
    rows.forEach(([category, question, answer]) => {
      if (question && answer) qaData.push({ question, answer });
    });
  });

const chatIcon = document.getElementById('chat-icon');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const chatContainer = document.getElementById('devbay-chat');
const closeChat = document.getElementById('close-chat');

chatIcon.onclick = () => chatContainer.classList.toggle('open');
closeChat.onclick = () => chatContainer.classList.remove('open');

sendBtn.onclick = handleUserMessage;
chatInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') handleUserMessage();
});

function handleUserMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';

  const reply = findAnswer(text);
  typeBotMessage(reply);
}

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add(sender === 'user' ? 'user-msg' : 'bot-msg');
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function findAnswer(input) {
  input = input.toLowerCase();
  const found = qaData.find(q => input.includes(q.question.toLowerCase()));
  return found ? found.answer : "Sorry, I couldn't find an answer to that.";
}

async function typeBotMessage(text) {
  const msg = document.createElement('div');
  msg.classList.add('bot-msg');
  chatBox.appendChild(msg);

  const words = text.split(' ');
  for (let w of words) {
    msg.textContent += w + ' ';
    chatBox.scrollTop = chatBox.scrollHeight;
    await new Promise(r => setTimeout(r, 80)); // typing speed
  }
}
