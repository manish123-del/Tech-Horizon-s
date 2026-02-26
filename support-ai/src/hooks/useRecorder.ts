import { useEffect, useRef, useState } from "react";

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    chunksRef.current = [];

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const an = audioCtx.createAnalyser();
    source.connect(an);
    setAnalyser(an);

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
    };
    mr.start();
    setRecording(true);
  }

  function stop() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
      setAnalyser(null);
    }
  }

  function reset() {
    setAudioBlob(null);
  }

  return { recording, audioBlob, analyser, start, stop, reset };
}
