import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "react-audio-play";
import { useRef, useEffect } from "react";

let currentAudioRef = null;

export default function IdeaCard({ idea }) {
  const playerRef = useRef(null);

  const handlePlay = () => {
    if (currentAudioRef && currentAudioRef !== playerRef.current) {
      currentAudioRef.pause();
    }
    currentAudioRef = playerRef.current;
  };

  useEffect(() => {
    return () => {
      if (currentAudioRef === playerRef.current) {
        currentAudioRef?.pause();
        currentAudioRef = null;
      }
    };
  }, []);
  return (
    <Card className="bg-white/10 backdrop-blur-md border border-white/10 shadow-lg rounded-2xl px-4 py-3 space-y-0">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg text-white">{idea.name}</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <a href={idea.pdf_url} target="_blank" rel="noreferrer">
            📄 PDF
          </a>
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden">
        <AudioPlayer
          ref={playerRef}
          onPlay={handlePlay}
          src={idea.audio_url}
          color="#97d7d3"
          sliderColor="#97d7d3"
          style={{
            background: "rgba(0, 0, 0, 0)",
            borderRadius: "12px",
            padding: "10px",
            width: "100%",
          }}
        />
      </div>
    </Card>
  );
}
