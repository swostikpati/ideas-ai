"use client";
import { useState, useRef } from "react";

export default function Recorder({ onSubmitSuccess }) {
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
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        alert("🎉 Idea submitted! Check your email soon.");
        onSubmitSuccess?.(); // ← Re-fetch ideas on success
      } else {
        alert("❌ Something went wrong: " + data.message);
      }
      //   alert("Done! Check your email soon.");
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
    <div className="text-white">
      <h2 className="text-2xl mb-4">🧠 Idea Recorder</h2>
      <button
        onClick={recording ? stopRecording : startRecording}
        className="bg-white text-black px-4 py-2 rounded"
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {audioURL && <audio src={audioURL} controls className="mt-4" />}
    </div>
  );
}
