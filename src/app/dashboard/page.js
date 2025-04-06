"use client";

import { useEffect, useState } from "react";
import {
  useUser,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
} from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import Recorder from "@/components/Recorder";
import IdeaCard from "@/components/IdeaCard";

export default function Dashboard() {
  const { user } = useUser();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = async () => {
    try {
      const res = await fetch("/api/ideas", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setIdeas(data);
      } else {
        throw new Error("Failed to fetch ideas");
      }
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground mx-4 sm:mx-8 max-w-xl pt-8 sm:pt-12 pb-8 sm:pb-12">
      {/* // <div className="min-h-screen flex flex-col justify-between bg-background text-foreground mx-4 sm:mx-8 max-w-xl pt-8 sm:pt-12 pb-8 sm:pb-12"> */}
      <SignedOut>
        <RedirectToSignIn redirectUrl="/" />
      </SignedOut>

      <SignedIn>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Hey {user?.firstName} 👋
          </h1>
          <UserButton />
        </div>

        <Recorder onSubmitSuccess={fetchIdeas} />
        <Separator className="my-6" />

        {loading ? (
          <div className="min-h-[55vh] space-y-4">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ) : ideas.length === 0 ? (
          <p className="min-h-[55vh] text-muted-foreground text-center mt-6">
            Nothing here… yet. Got a dumb idea?
          </p>
        ) : (
          // <div className="space-y-4">
          //   {ideas.map((idea) => (
          //     <Card key={idea.id} className="bg-card shadow-md">
          //       <CardHeader>
          //         <CardTitle className="text-lg">{idea.name}</CardTitle>
          //       </CardHeader>
          //       <CardContent className="flex gap-3">
          //         <Button variant="secondary" asChild>
          //           <a href={idea.audio_url} target="_blank" rel="noreferrer">
          //             🎧 Audio
          //           </a>
          //         </Button>
          //         <Button variant="outline" asChild>
          //           <a href={idea.pdf_url} target="_blank" rel="noreferrer">
          //             📄 PDF
          //           </a>
          //         </Button>
          //       </CardContent>
          //     </Card>
          //   ))}
          // </div>
          <div className="min-h-[55vh] space-y-4">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}
      </SignedIn>
      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 pt-4 text-sm text-muted-foreground flex justify-between w-full max-w-md mx-auto">
        <span>© 2025 dumbideas.ai</span>
        <div className="flex gap-4">
          <a
            href="https://www.linkedin.com/in/swostikpati"
            target="_blank"
            className="hover:underline"
          >
            Linkedin
          </a>
          <a
            href="https://github.com/swostikpati"
            target="_blank"
            className="hover:underline"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
