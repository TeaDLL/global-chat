let pubnub;
const channel = "glow-chat-room";
let username = sessionStorage.getItem("username");
const messagesBox = document.getElementById("messages");

// UI Elements
const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");

function saveMessageToSession(msg) {
  let history = JSON.parse(sessionStorage.getItem("chat-history") || "[]");
  history.push(msg);
  sessionStorage.setItem("chat-history", JSON.stringify(history));
}

function loadMessages() {
  const history = JSON.parse(sessionStorage.getItem("chat-history") || "[]");
  history.forEach(renderMessage);
}

function renderMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";
  if (msg.image) {
    const img = document.createElement("img");
    img.src = msg.image;
    div.appendChild(img);
  } else {
    div.innerHTML = `<strong>${msg.sender}:</strong> ${msg.text}`;
  }
  messagesBox.appendChild(div);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function setupPubNub() {
  pubnub = new PubNub({
    publishKey: "pub-c-26ce4ceb-56b4-4e05-9b4b-d3efd6ec59ad",
    subscribeKey: "sub-c-6765e36a-b6d8-4003-8a93-e94fae035608",
    uuid: username,
  });

  pubnub.subscribe({ channels: [channel] });

  pubnub.addListener({
    message: (event) => {
      renderMessage(event.message);
      saveMessageToSession(event.message);
    },
  });
}

function sendTextMessage() {
  const text = document.getElementById("message-input").value.trim();
  if (!text) return;
  const msg = { sender: username, text };
  pubnub.publish({ channel, message: msg });
  document.getElementById("message-input").value = "";
}

function sendImageMessage(base64) {
  const msg = { sender: username, image: base64 };
  pubnub.publish({ channel, message: msg });
}

// Login logic
document.getElementById("login-btn").onclick = () => {
  const input = document.getElementById("username").value.trim();
  if (!input) return alert("Enter a username");
  username = input;
  sessionStorage.setItem("username", username);
  loginScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  setupPubNub();
  loadMessages();
};

// Send button
document.getElementById("send-btn").onclick = sendTextMessage;

// Image upload
document.getElementById("image-btn").onclick = () => {
  document.getElementById("image-upload").click();
};

document.getElementById("image-upload").onchange = (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => sendImageMessage(reader.result);
  reader.readAsDataURL(file);
};

// Paste image
document.getElementById("message-input").addEventListener("paste", (event) => {
  const items = event.clipboardData.items;
  for (let item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = () => sendImageMessage(reader.result);
      reader.readAsDataURL(file);
    }
  }
});

// Auto login if session exists
if (username) {
  loginScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  setupPubNub();
  loadMessages();
}
