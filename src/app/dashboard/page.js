// src/app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import {
  useUser,
  SignedIn,
  SignedOut,
  SignInButton,
  RedirectToSignIn,
  UserButton,
} from "@clerk/nextjs";
import Recorder from "@/components/Recorder";

export default function Dashboard() {
  const { user } = useUser();
  const [ideas, setIdeas] = useState([]);

  const fetchIdeas = async () => {
    const res = await fetch("/api/ideas", { credentials: "include" });
    const data = await res.json();
    if (res.ok) {
      setIdeas(data);
    } else {
      console.error("Failed to fetch ideas", data);
    }
  };
  useEffect(() => {
    fetchIdeas();
  }, []);

  return (
    <div className="p-4">
      <SignedOut>
        <RedirectToSignIn redirectUrl="/" />
      </SignedOut>

      <SignedIn>
        <UserButton />
        <h1 className="text-xl font-bold mb-4">Welcome {user?.firstName}!</h1>
        <Recorder onSubmitSuccess={fetchIdeas} />

        {ideas.length === 0 ? (
          <p>No ideas yet. Go dream something up tonight 😴</p>
        ) : (
          <div className="grid gap-4">
            {ideas.map((idea) => (
              <div key={idea.id} className="border p-4 rounded shadow">
                <h2 className="text-lg font-semibold">{idea.name}</h2>
                <p>
                  <a href={idea.audio_url} target="_blank" rel="noreferrer">
                    🎧 Audio
                  </a>{" "}
                  |{" "}
                  <a href={idea.pdf_url} target="_blank" rel="noreferrer">
                    📄 PDF
                  </a>
                </p>
              </div>
            ))}
          </div>
        )}
      </SignedIn>
    </div>
  );
}
