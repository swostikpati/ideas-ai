"use client";
import { useState, useRef } from "react";
import { AudioPlayer } from "react-audio-play";
import { Button } from "@/components/ui/button";

export default function Recorder({ onSubmitSuccess }) {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      setAudioBlob(blob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setRecording(false);
  };

  const submitRecording = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append("audio", audioBlob);

    const res = await fetch("/api/submit", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();
    if (res.ok) {
      alert("🎉 Idea submitted! Check your email soon.");
      setAudioURL(null);
      setAudioBlob(null);
      onSubmitSuccess?.(); // Re-fetch ideas if needed
    } else {
      alert("❌ Something went wrong: " + data.message);
    }
  };

  const resetRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    chunksRef.current = [];
  };

  return (
    <div className="mb-8">
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <span className="bg-primary/10 text-primary p-1 rounded">🧠</span>
          Record Your Ideas
        </h2>
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          {!audioURL && (
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
          )}

          {/* {audioURL && (
            <div className="mt-4 bg-muted/50 rounded-md p-2 space-y-4">
              <audio src={audioURL} controls className="w-full h-10" />
              <div className="flex gap-2">
                <button
                  onClick={submitRecording}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  ✅ Submit Idea
                </button>
                <button
                  onClick={resetRecording}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                  🔁 Re-record
                </button>
              </div>
            </div>
          )} */}
          {audioURL && (
            <div className=" bg-white/5 backdrop-blur-md rounded-xl p-4 space-y-4 border border-white/10 shadow-sm">
              {/* Custom Audio Player */}
              <AudioPlayer
                // ref={playerRef}
                // onPlay={handlePlay}
                src={audioURL}
                color="#97d7d3"
                sliderColor="#97d7d3"
                style={{
                  background: "transparent",
                  borderRadius: "12px",
                  padding: "10px",
                  width: "100%",
                }}
              />

              {/* Refined Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={submitRecording}
                  variant="outline"
                  className="px-4 py-2"
                >
                  Submit Idea ✅
                </Button>
                <Button
                  onClick={resetRecording}
                  variant="outline"
                  className="px-4 py-2"
                >
                  Re-record 🔁
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
