// app/page.js
"use client";
import { useState, useRef } from "react";

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);

      const formData = new FormData();
      formData.append("audio", blob);

      const res = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      alert("Done! Check your email soon."); // We'll schedule this later
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setRecording(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🧠 Idea Recorder</h1>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {audioURL && <audio src={audioURL} controls />}
    </div>
  );
}
