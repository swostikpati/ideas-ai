"use client";

import { useState, useRef } from "react";
import { AudioPlayer } from "react-audio-play";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Recorder({ onSubmitSuccess }) {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mimeType, setMimeType] = useState("audio/webm");
  const chunksRef = useRef([]);

  // const startRecording = async () => {
  //   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //   const recorder = new MediaRecorder(stream);
  //   chunksRef.current = [];

  //   recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
  //   recorder.onstop = () => {
  //     const blob = new Blob(chunksRef.current, { type: "audio/webm" });
  //     const url = URL.createObjectURL(blob);
  //     setAudioURL(url);
  //     setAudioBlob(blob);
  //   };

  //   recorder.start();
  //   setMediaRecorder(recorder);
  //   setRecording(true);
  // };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    let options = {};
    if (MediaRecorder.isTypeSupported("audio/webm")) {
      options.mimeType = "audio/webm";
    } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
      options.mimeType = "audio/mp4";
    }

    const recorder = new MediaRecorder(stream, options);
    chunksRef.current = [];
    setMimeType(options.mimeType || "audio/webm");
    console.log("🎙️ MIME Type used:", mimeType);

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const type = chunksRef.current[0]?.type || mimeType;
      const blob = new Blob(chunksRef.current, { type });
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

    let extension = "webm";
    if (mimeType.includes("mp4")) extension = "m4a";
    else if (mimeType.includes("ogg")) extension = "ogg";

    const formData = new FormData();
    formData.append("audio", audioBlob, `recording.${extension}`);

    try {
      setLoading(true);
      const res = await fetch("/api/submit", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        // Show toast on failure
        toast("Oops something went wrong, please try again!");
        // resetRecording(); // Go back to re-record + submit
        setConfirmation(false); // Show re-submit and re-record
        setLoading(false);
        return;
      }

      setConfirmation(true);
      setAudioURL(null);
      setAudioBlob(null);
      onSubmitSuccess?.();
    } catch (error) {
      console.error("❌ Submission failed:", error.message);
      toast("Oops something went wrong, please try again");
      resetRecording(); // Still allow user to retry
    } finally {
      setLoading(false);
    }
  };

  // const submitRecording = async () => {
  //   if (!audioBlob) return;

  //   let extension = "webm"; // default fallback

  //   if (mimeType.includes("mp4")) {
  //     extension = "m4a";
  //   } else if (mimeType.includes("ogg")) {
  //     extension = "ogg";
  //   }

  //   const formData = new FormData();
  //   formData.append("audio", audioBlob, `recording.${extension}`);

  //   try {
  //     setLoading(true);
  //     await fetch("/api/submit", {
  //       method: "POST",
  //       body: formData,
  //       credentials: "include",
  //     });

  //     setConfirmation(true);
  //     setAudioURL(null);
  //     setAudioBlob(null);
  //     onSubmitSuccess?.();
  //   } catch (error) {
  //     console.error("❌ Submission failed:", error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const submitRecording = async () => {
  //   if (!audioBlob) return;

  //   const formData = new FormData();
  //   formData.append("audio", audioBlob);

  //   try {
  //     setLoading(true); // ← Start loading
  //     await fetch("/api/submit", {
  //       method: "POST",
  //       body: formData,
  //       credentials: "include",
  //     });

  //     setConfirmation(true);
  //     setAudioURL(null);
  //     setAudioBlob(null);
  //     onSubmitSuccess?.(); // Re-fetch ideas if needed
  //   } catch (error) {
  //     console.error("❌ Submission failed:", error.message);
  //   } finally {
  //     setLoading(false); // ← Stop loading no matter what
  //   }
  // };

  const resetRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    setConfirmation(false);
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
          {!audioURL && !recording && !confirmation && (
            <button
              onClick={startRecording}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <span>🎙️</span> Start Recording
            </button>
          )}

          {recording && (
            <button
              onClick={stopRecording}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all"
            >
              <span className="animate-pulse">⚫</span> Stop Recording
            </button>
          )}

          {audioURL && !confirmation && (
            <div className="mt-4 bg-white/5 backdrop-blur-md rounded-xl p-4 space-y-4 border border-white/10 shadow-sm">
              {loading ? (
                <>
                  <div className="text-center bg-blue-800/30 border border-blue-600 text-blue-200 py-4 px-6 rounded-lg font-medium">
                    ✨Let the magic happen...
                  </div>

                  <div className="flex justify-center items-center py-6">
                    <span className="animate-spin h-6 w-6 rounded-full border-2 border-t-transparent border-white" />
                  </div>
                </>
              ) : (
                <>
                  <AudioPlayer
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

                  <div className="flex gap-3 justify-end">
                    <Button onClick={submitRecording} variant="outline">
                      Submit Idea ✅
                    </Button>
                    <Button onClick={resetRecording} variant="outline">
                      Re-record 🔁
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {confirmation && (
            <div className="space-y-4">
              <div className="text-center bg-green-800/30 border border-green-600 text-green-200 py-4 px-6 rounded-lg font-medium">
                Your idea is being processed and will be emailed to you shortly!
              </div>

              <div className="flex justify-end">
                <Button onClick={resetRecording} variant="outline">
                  ✅ Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
