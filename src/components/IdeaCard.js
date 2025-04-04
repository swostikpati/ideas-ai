import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IdeaCard({ idea }) {
  return (
    <Card className="bg-card shadow-md">
      <CardHeader>
        <CardTitle className="text-lg text-white">{idea.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button variant="secondary" asChild>
          <a href={idea.audio_url} target="_blank" rel="noreferrer">
            🎧 Audio
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={idea.pdf_url} target="_blank" rel="noreferrer">
            📄 PDF
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
