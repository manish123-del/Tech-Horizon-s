import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function VoiceChat() {
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState("auto"); // auto, hi-IN, en-US
  const [recognizedText, setRecognizedText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState(null);
  const [duration, setDuration] = useState("00:00");
  const [finalDuration, setFinalDuration] = useState("00:00");
  const [isStarting, setIsStarting] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [micError, setMicError] = useState("");
  const [listeningText, setListeningText] = useState("");
  const recognitionRef = useRef(null);
  const retryRef = useRef(false);
  const lastResultTsRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!callStartedAt || !listening) return;
      const elapsed = Math.floor((Date.now() - callStartedAt) / 1000);
      const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const ss = String(elapsed % 60).padStart(2, "0");
      setDuration(`${mm}:${ss}`);
    }, 500);
    return () => clearInterval(interval);
  }, [callStartedAt, listening]);

  useEffect(() => {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;
    setMicSupported(!!SR);
    if (!SR) return;
    const mapError = (code) => {
      const m = {
        "network": "Speech recognition network error. Check internet connection.",
        "not-allowed": "Microphone permission denied. Allow mic access in browser.",
        "no-speech": "No speech detected. Please speak clearly.",
        "audio-capture": "No microphone detected. Enable or connect your mic.",
        "service-not-allowed": "Speech service not available. Use Chrome desktop.",
        "aborted": "Listening aborted. Click Start Talking to try again."
      };
      return m[code] || "Microphone error. Retry.";
    };
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang =
      language === "auto" ? "hi-IN" : language; // default to Hindi for demo

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setRecognizedText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else {
          interim += transcript;
        }
        lastResultTsRef.current = Date.now();
      }
      if (interim) {
        setRecognizedText(interim);
      }
    };

    recognition.onstart = () => {
      setListening(true);
      setListeningText("Listening…");
      setMicError("");
      retryRef.current = false;
      lastResultTsRef.current = Date.now();
    };

    recognition.onerror = (e) => {
      const code = e?.error;
      if ((code === "service-not-allowed" || code === "network" || code === "audio-capture") && !retryRef.current) {
        retryRef.current = true;
        setListeningText("");
        setListening(false);
        try { recognition.stop(); } catch {}
        setTimeout(() => {
          try {
            recognition.lang = "en-US";
            setListening(true);
            recognition.start();
          } catch {
            setMicError(mapError(code));
            setListening(false);
          }
        }, 300);
        return;
      }
      setMicError(mapError(code));
      setListeningText("");
      setListening(false);
    };

    recognition.onnomatch = () => {
      setMicError("Couldn't understand speech. Please speak clearly.");
    };

    recognition.onend = () => {
      setListeningText("");
      setListening(false);
      // freeze timer at final duration on end
      if (callStartedAt) {
        const elapsed = Math.floor((Date.now() - callStartedAt) / 1000);
        const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const ss = String(elapsed % 60).padStart(2, "0");
        setFinalDuration(`${mm}:${ss}`);
      }
    };
  }, [language]);

  async function startTalking() {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SR) {
      setMicSupported(false);
      setMicError("SpeechRecognition not supported. Use Chrome desktop.");
      return;
    }
    if (!callStartedAt) {
      setCallStartedAt(Date.now());
      setFinalDuration("00:00");
    }
    setRecognizedText("");
    setListening(true);
    setIsStarting(true);
    recognitionRef.current.lang =
      language === "auto" ? "hi-IN" : language; // prefer Hindi in auto
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      recognitionRef.current.start();
    } catch (e) {
      setMicError("Could not start microphone. Allow mic permission and retry.");
      setListening(false);
    } finally {
      setIsStarting(false);
    }
  }

  function endCall() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setListening(false);
    // do not reset the final duration; keep it frozen
    setCallStartedAt(null);
    setListeningText("");
    retryRef.current = false;
  }

  async function sendToAI() {
    if (!recognizedText) return;
    setLoading(true);
    const userMsg = {
      role: "user",
      text: recognizedText,
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      // optional quick health check to surface clearer errors
      try {
        await fetch(`${BACKEND_URL}/health`, { method: "GET" });
      } catch (e) {
        throw new Error("Backend not reachable at " + BACKEND_URL);
      }
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: recognizedText, lang: language }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Backend error ${res.status}: ${errText}`);
      }
      const data = await res.json();
      const aiMsg = {
        role: "assistant",
        text: data.reply,
        emotion: data.detectedEmotion,
        urgency: data.urgencyLevel,
        intent: data.intent,
      };
      setMessages((prev) => [...prev, aiMsg]);
      speak(data.reply, data.urgencyLevel, data.detectedEmotion);
    } catch (e) {
      const aiMsg = {
        role: "assistant",
        text: String(
          e?.message ||
            "Sorry, I couldn't reach the backend. Please check server and try again."
        ),
        emotion: "neutral",
        urgency: "low",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
      setRecognizedText("");
    }
  }

  function speak(text, urgency, emotion) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    // voice selection hint
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice =
      voices.find((v) => /hi-IN/i.test(v.lang)) ||
      voices.find((v) => /en-IN/i.test(v.lang));
    if (hindiVoice) utter.voice = hindiVoice;
    // tone adjustment
    utter.rate = urgency === "high" ? 1.15 : 1.0;
    utter.pitch = emotion === "angry" ? 1.1 : 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <div className="voice-chat">
      <div className="controls">
        <div className="lang-toggle">
          <label>Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            title="Choose recognition language"
          >
            <option value="auto">Auto (Hindi-first)</option>
            <option value="hi-IN">Hindi (hi-IN)</option>
            <option value="en-US">English (en-US)</option>
          </select>
        </div>
        <div className="call-controls">
          <button
            className={`primary ${isStarting ? "disabled" : ""}`}
            onClick={listening ? endCall : startTalking}
            disabled={isStarting}
          >
            {listening ? "⏹️ Stop Listening" : "🎙️ Start Talking"}
          </button>
          <button className="ghost" onClick={endCall}>
            ⏹️ End Call
          </button>
          <span className="duration">⏱ {listening ? duration : finalDuration}</span>
          <span className="status">{listeningText}</span>
        </div>
      </div>
      {!micSupported && <div className="note">Microphone not supported. Use Chrome on desktop.</div>}
      {micError && <div className="alert high">{micError}</div>}

      <div className="input-panel">
        <textarea
          placeholder="Recognized speech appears here..."
          value={recognizedText}
          onChange={(e) => setRecognizedText(e.target.value)}
          rows={3}
        />
        <button className="secondary" onClick={sendToAI} disabled={loading}>
          {loading ? "Thinking..." : "Send to AI"}
        </button>
      </div>

      <div className="chat-list">
        {messages.map((m, idx) => (
          <ChatBubble key={idx} {...m} />
        ))}
      </div>

      {messages.some((m) => m.urgency === "high") && (
        <div className="alert high">
          ⚠️ Escalating to human agent...
        </div>
      )}
    </div>
  );
}
