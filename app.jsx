// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import { Picker } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";

const MESSAGE_STATUS = {
  SENT: "✓",
  DELIVERED: "✓✓",
  READ: "✓✓ (blue)",
};

function App() {
  // State
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [inputUsername, setInputUsername] = useState("");
  const [loggedIn, setLoggedIn] = useState(!!username);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(() => {
    // Load messages from localStorage or start empty
    const saved = localStorage.getItem("messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("username", username);
  }, [username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // Simulate typing indicator (in real app, broadcast to others)
  function handleTyping() {
    if (!username) return;
    if (!typingUsers.includes(username)) {
      setTypingUsers((prev) => [...prev, username]);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    }, 1000);
  }

  function onLogin() {
    if (inputUsername.trim()) {
      setUsername(inputUsername.trim());
      setLoggedIn(true);
    }
  }

  function sendMessage() {
    if (!messageInput.trim()) return;
    const newMessage = {
      id: Date.now(),
      user: username,
      text: messageInput.trim(),
      timestamp: new Date().toISOString(),
      replyTo,
      status: MESSAGE_STATUS.SENT,
      image: null,
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
    setReplyTo(null);
    setShowEmojiPicker(false);
  }

  // Reply to message
  function startReply(msg) {
    setReplyTo(msg);
  }

  // Cancel reply
  function cancelReply() {
    setReplyTo(null);
  }

  // Add emoji to input
  function addEmoji(emoji) {
    setMessageInput((prev) => prev + emoji.native);
  }

  // Handle image upload
  function onImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newMessage = {
        id: Date.now(),
        user: username,
        text: "",
        timestamp: new Date().toISOString(),
        replyTo,
        status: MESSAGE_STATUS.SENT,
        image: reader.result,
      };
      setMessages((prev) => [...prev, newMessage]);
      setReplyTo(null);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  }

  return (
    <div className="app">
      {!loggedIn ? (
        <div className="login-screen">
          <div className="login-box">
            <h2>Enter your username</h2>
            <input
              type="text"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onLogin()}
              placeholder="Username"
              autoFocus
            />
            <button onClick={onLogin}>Login</button>
          </div>
        </div>
      ) : (
        <div className="chat-container">
          <div className="sidebar">
            <h1>Chats</h1>
            <div className="user-info">
              Logged in as <b>{username}</b>
            </div>
            {/* For demo, single global chat */}
            <div className="chat-list">
              <div className="chat-item active">Global Chat</div>
            </div>
          </div>
          <div className="chat-main">
            <header className="chat-header">
              <div>Global Chat</div>
              <button
                onClick={() => {
                  setLoggedIn(false);
                  setUsername("");
                  localStorage.removeItem("username");
                  localStorage.removeItem("messages");
                  setMessages([]);
                }}
                className="logout-btn"
                title="Logout"
              >
                Logout
              </button>
            </header>
            <div className="messages" onClick={() => setShowEmojiPicker(false)}>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.user === username}
                  onReply={() => startReply(msg)}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                {typingUsers
                  .filter((u) => u !== username)
                  .map((u) => `${u} is typing...`)
                  .join(", ")}
              </div>
            )}
            {replyTo && (
              <div className="reply-box">
                Replying to <b>{replyTo.user}</b>: {replyTo.text || "📷 Image"}
                <button className="cancel-reply" onClick={cancelReply}>
                  ×
                </button>
              </div>
            )}
            <div className="input-area">
              <button
                className="emoji-btn"
                onClick={() => setShowEmojiPicker((v) => !v)}
                title="Emoji Picker"
              >
                😊
              </button>
              <input
                type="file"
                accept="image/*"
                id="image-upload"
                style={{ display: "none" }}
                onChange={onImageUpload}
              />
              <label htmlFor="image-upload" className="upload-btn" title="Attach Image">
                📎
              </label>
              <textarea
                className="message-input"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message"
                rows={1}
              />
              <button className="send-btn" onClick={sendMessage} title="Send">
                ➤
              </button>
            </div>
            {showEmojiPicker && (
              <div className="emoji-picker">
                <Picker onSelect={addEmoji} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, isOwn, onReply }) {
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`message-bubble ${isOwn ? "own" : ""}`}>
      <div className="message-info">
        <div className="message-user">{message.user}</div>
        <div className="message-time">{time}</div>
      </div>
      {message.replyTo && (
        <div className="reply-quote">
          <b>{message.replyTo.user}</b>: {message.replyTo.text || "📷 Image"}
        </div>
      )}
      {message.text && <div className="message-text">{message.text}</div>}
      {message.image && (
        <img
          src={message.image}
          alt="attachment"
          className="message-image"
          onClick={() => window.open(message.image, "_blank")}
        />
      )}
      {isOwn && <div className="message-status">{message.status}</div>}
      <button className="reply-btn" onClick={onReply} title="Reply to message">
        ↩
      </button>
    </div>
  );
}

export default App;
