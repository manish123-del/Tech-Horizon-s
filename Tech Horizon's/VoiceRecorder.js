import React from "react";

const VoiceRecorder = ({ onResult }) => {
  const startListening = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
  };

  return <button onClick={startListening}>🎤 Start Talking</button>;
};

export default VoiceRecorder;