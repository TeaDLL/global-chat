const pubnub = new PubNub({
  publishKey: "pub-c-26ce4ceb-56b4-4e05-9b4b-d3efd6ec59ad",
  subscribeKey: "sub-c-6765e36a-b6d8-4003-8a93-e94fae035608",
  uuid: null,
});

const channel = "black-white-glow-chat";

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const usernameInput = document.getElementById("username");
const loginBtn = document.getElementById("login-btn");

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const imageBtn = document.getElementById("image-btn");
const imageUpload = document.getElementById("image-upload");

let username = sessionStorage.getItem("username") || null;

function renderMessage(msg) {
  const div = document.createElement("div");
  div.classList.add("message");
  if (msg.sender === username) div.classList.add("self");

  if (msg.image) {
    const senderStrong = document.createElement("strong");
    senderStrong.textContent = msg.sender;
    div.appendChild(senderStrong);

    const img = document.createElement("img");
    img.src = msg.image;
    div.appendChild(img);
  } else {
    div.innerHTML = `<strong>${msg.sender}</strong>${escapeHtml(msg.text)}`;
  }

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Basic text escaping to avoid any raw HTML display
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function saveMessage(msg) {
  let history = JSON.parse(sessionStorage.getItem("chat-history") || "[]");
  history.push(msg);
  sessionStorage.setItem("chat-history", JSON.stringify(history));
}

function loadHistory() {
  const history = JSON.parse(sessionStorage.getItem("chat-history") || "[]");
  history.forEach(renderMessage);
}

function sendMessage(text, image = null) {
  if ((!text || text.trim() === "") && !image) return;
  const msg = {
    sender: username,
    text: text || "",
    image,
  };
  pubnub.publish({ channel, message: msg });
  saveMessage(msg);
  renderMessage(msg);
  messageInput.value = "";
  adjustTextareaHeight();
}

function setupPubNub() {
  pubnub.setUUID(username);
  pubnub.subscribe({ channels: [channel] });
  pubnub.addListener({
    message: (event) => {
      const msg = event.message;
      if (msg.sender !== username) {
        renderMessage(msg);
        saveMessage(msg);
      }
    },
  });
}

// Event listeners
loginBtn.onclick = () => {
  const val = usernameInput.value.trim();
  if (!val) return alert("Please enter a username");
  username = val;
  sessionStorage.setItem("username", username);
  loginScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  setupPubNub();
  loadHistory();
};

sendBtn.onclick = () => {
  sendMessage(messageInput.value);
};

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage(messageInput.value);
  }
});

imageBtn.onclick = () => imageUpload.click();

imageUpload.onchange = (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    sendMessage(null, reader.result);
  };
  reader.readAsDataURL(file);
};

messageInput.addEventListener("paste", (e) => {
  const items = e.clipboardData.items;
  for (let item of items) {
    if (item.type.startsWith("image
