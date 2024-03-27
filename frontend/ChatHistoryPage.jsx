import React from "react";

const ChatHistoryPage = ({ chatHistory }) => {
  return (
    <div style={{ maxHeight: "300px", overflowY: "auto" }} className="chat-history">
      {chatHistory.map((message, index) => (
        <div key={index} className={`message ${message.role}`} style={{ margin: "5px 0", padding: "10px 12px", borderRadius: "8px", maxWidth: "100%", backgroundColor: message.role === "user" ? "#3B82F6" : "#34D399", color: "white", alignSelf: message.role === "user" ? "flex-end" : "flex-start" }}>
          <div className="message-label">
            {message.role === "user" ? "You: " : "Bot: "}
          </div>
          <div className="message-content">
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatHistoryPage;
