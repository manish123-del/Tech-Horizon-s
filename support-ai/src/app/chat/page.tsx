"use client";
import { useRecorder } from "@/hooks/useRecorder";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Message, Conversation } from "@/types";

// map detected language to a TTS voice name
const voiceMap: Record<string, string> = {
  en: "alloy",
  hi: "hindi",
  ta: "tamil",
  te: "telugu",
  mr: "marathi",
  bn: "bengali"
};

type Msg = {
  role: "user" | "assistant";
  text: string;
  sentiment?: string;
  urgency?: string;
  language?: string;
  fraud?: boolean;
};

export default function ChatPage() {
  const { recording, audioBlob, analyser, start, stop, reset } = useRecorder();
  const [botConfig, setBotConfig] = useState<{ system_prompt?: string; theme_color?: string } | null>(null);

  const accentColor = botConfig?.theme_color || "#fff";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // state moved above, placeholder removed

  // load or create conversation when component mounts
  useEffect(() => {
    (async () => {
      // fetch bot configuration (use first row)
      const { data: cfg } = await supabase.from("bot_configs").select("*").limit(1).single();
      if (cfg) setBotConfig(cfg as any);
      // try to fetch last open conversation for this user
      const { data: conv } = await supabase
        .from<Conversation>("conversations")
        .select("*")
        .eq("channel", "web")
        .order("started_at", { ascending: false })
        .limit(1)
        .single();
      if (conv) {
        setConversationId(conv.id);
        // load previous messages
        const { data: msgs } = await supabase
          .from<Message>("messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });
        if (msgs) {
          setMessages(
            msgs.map((m) => ({
              role: m.role,
              text: m.content,
              sentiment: m.sentiment,
              urgency: m.urgency,
              language: m.language,
              fraud: (m as any).fraud || false
            }))
          );
        }
      } else {
        const { data: newConv } = await supabase
          .from<Conversation>("conversations")
          .insert({ channel: "web" })
          .select("*")
          .single();
        if (newConv) setConversationId(newConv.id);
      }
    })();
  }, []);

  // automatically transcribe audio blob
  useEffect(() => {
    if (!audioBlob) return;
    const fd = new FormData();
    fd.append("file", audioBlob, "voice.webm");
    fetch("/api/transcribe", { method: "POST", body: fd })
      .then((r) => r.json())
      .then((d) => setText(d.text || ""))
      .catch(() => {});
  }, [audioBlob]);

  // waveform drawing loop
  useEffect(() => {
    let raf: number;

    function draw() {
      const canvas = canvasRef.current;
      const analyserNode = analyser;
      if (!canvas || !analyserNode) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteTimeDomainData(dataArray);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0f0";
      ctx.beginPath();
      let sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = (v * height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    }
    if (recording || playing) {
      raf = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(raf);
    }
    return () => cancelAnimationFrame(raf);
  }, [recording, playing, analyser]);

  async function send() {
    if (!text) return;
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text }]);
    try {
      // build payload, include conv id if available
      const payload: any = { text };
      if (conversationId) payload.conversationId = conversationId;
      if (botConfig?.system_prompt) payload.systemPrompt = botConfig.system_prompt;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
          sentiment: data.sentiment,
          urgency: data.urgency,
          language: data.language,
          fraud: data.fraud
        }
      ]);
      // play TTS; choose voice based on detected language
      const voice = voiceMap[data.language] || "alloy";
      const tts = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.reply, voice })
      });
      const audioBuf = await tts.arrayBuffer();
      const blob = new Blob([audioBuf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) audioRef.current = new Audio();
      if (audioRef.current) {
        const ctx = new AudioContext();
        const src = ctx.createMediaElementSource(audioRef.current);
        const an = ctx.createAnalyser();
        src.connect(an);
        an.connect(ctx.destination);
        setPlaying(true);
        audioRef.current.onended = () => {
          setPlaying(false);
          ctx.close();
        };
      }
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    } finally {
      setLoading(false);
      setText("");
      reset();
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Chat</h1>
      {/* waveform visualization */}
      <canvas ref={canvasRef} width={600} height={60} className="w-full bg-black rounded" />
      <div className="flex gap-2 items-center">
        <div className="relative">
          {recording && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75"></span>
          )}
          <Button
            onClick={recording ? stop : start}
            style={{ backgroundColor: accentColor, color: accentColor === "#fff" ? "#000" : "#fff" }}
          >
            {recording ? "Stop Recording" : "Start Recording"}
          </Button>
        </div>
        <Button
          variant="secondary"
          onClick={send}
          disabled={loading || !text}
          style={{ backgroundColor: accentColor, color: accentColor === "#fff" ? "#000" : "#fff" }}
        >
          {loading ? "Thinking..." : "Send"}
        </Button>
      </div>
      <textarea
        className="w-full rounded-md border border-neutral-800 bg-neutral-900 p-2"
        rows={3}
        placeholder="Type or speak..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              "rounded-md border border-neutral-800 p-3 transform transition-transform duration-300 fade-in " +
              (m.role === "user" ? "translate-x-0" : "translate-x-0")
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">{m.role === "user" ? "You" : "Assistant"}</span>
              <div className="flex gap-2">
                {m.sentiment && <Badge intent={m.sentiment as any}>{m.sentiment}</Badge>}
                {m.urgency && <Badge intent={m.urgency as any}>{m.urgency}</Badge>}
                {m.language && <Badge intent="neutral">{m.language}</Badge>}
                {m.fraud && <Badge intent="critical">fraud</Badge>}
              </div>
            </div>
            {m.role === "assistant" && botConfig?.avatar_url && (
              <img src={botConfig.avatar_url} alt="bot avatar" className="w-8 h-8 rounded-full mt-2" />
            )}
            <p className="mt-2">{m.text}</p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="animate-pulse">Assistant is typing</span>
            <span className="dots">...</span>
          </div>
        )}
      </div>
    </main>
  );
}
