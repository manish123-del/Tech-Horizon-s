import React from "react";

export default function ChatBubble({ role, text, emotion, urgency, intent }) {
  const isUser = role === "user";
  return (
    <div className={`bubble ${isUser ? "user" : "ai"}`}>
      <div className="bubble-header">
        <span className="who">{isUser ? "You" : "Assistant"}</span>
        {!isUser && (
          <div className="badges">
            {emotion && <span className={`badge emotion-${emotion}`}>{emotion}</span>}
            {urgency && <span className={`badge urgency-${urgency}`}>{urgency}</span>}
            {intent && <span className="badge intent">{intent}</span>}
          </div>
        )}
      </div>
      <p className="bubble-text">{text}</p>
    </div>
  );
}
