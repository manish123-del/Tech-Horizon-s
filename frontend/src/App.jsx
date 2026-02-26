import React, { useState } from "react";
import VoiceChat from "./components/VoiceChat.jsx";
import Analytics from "./components/Analytics.jsx";

export default function App() {
  const [view, setView] = useState("chat");
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">◎</span>
          <h1>AI Voice Assistant</h1>
        </div>
        <nav className="nav">
          <button
            className={view === "chat" ? "active" : ""}
            onClick={() => setView("chat")}
          >
            Conversation
          </button>
          <button
            className={view === "analytics" ? "active" : ""}
            onClick={() => setView("analytics")}
          >
            Analytics
          </button>
        </nav>
      </header>
      {view === "chat" ? <VoiceChat /> : <Analytics />}
      <footer className="app-footer">
        <p>
          Multilingual, empathetic, real-time assistant • Hindi + English • Web
          Speech API
        </p>
      </footer>
    </div>
  );
}
