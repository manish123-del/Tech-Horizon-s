import React, { useState } from "react";
import VoiceRecorder from "./components/VoiceRecorder";
import ChatWindow from "./components/ChatWindow";
import { sendMessage } from "./services/api";

function App() {
  const [userText, setUserText] = useState("");
  const [botReply, setBotReply] = useState("");

  const handleVoice = async (text) => {
    setUserText(text);
    const data = await sendMessage(text);

    setBotReply(data.reply);
    speak(data.reply, data.emotion);
  };

  const speak = (msg, emotion) => {
    const speech = new SpeechSynthesisUtterance(msg);

    if (emotion === "angry") {
      speech.rate = 0.8;
      speech.pitch = 0.6;
    }

    window.speechSynthesis.speak(speech);
  };

  return (
    <div>
      <h1>🤖 AwaazAI</h1>
      <VoiceRecorder onResult={handleVoice} />
      <ChatWindow userText={userText} botReply={botReply} />
    </div>
  );
}

export default App;
