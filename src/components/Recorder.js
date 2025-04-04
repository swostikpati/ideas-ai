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
    <div className="mb-8">
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <span className="bg-primary/10 text-primary p-1 rounded">🧠</span>
          Record Your Ideas
        </h2>
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-md transition-all ${
              recording
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {recording ? (
              <>
                <span className="animate-pulse">⚫</span>
                Stop Recording
              </>
            ) : (
              <>
                <span>🎙️</span>
                Start Recording
              </>
            )}
          </button>

          {audioURL && (
            <div className="mt-4 bg-muted/50 rounded-md p-2">
              <audio src={audioURL} controls className="w-full h-10" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
