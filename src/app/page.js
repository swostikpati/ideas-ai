"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#0b0c10] text-white px-6 py-8">
      {/* Top Bar */}
      <header className="flex items-center justify-between w-full">
        <span className="text-xl font-semibold tracking-tight">
          dumbideas.ai
        </span>
        <SignedOut>
          <SignInButton>
            <Button variant="ghost" className="text-xl font-medium">
              Login
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-blue-300 text-sm hover:underline"
            >
              Dashboard
            </Link>
            <UserButton />
          </div>
        </SignedIn>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center mt-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold max-w-xl leading-tight">
          <span className="text-6xl sm:text-7xl font-serif text-primary">
            “
          </span>
          <br />
          Building unicorns from your 2am ideas
        </h1>
        <p className="mt-8 text-lg text-muted-foreground max-w-md">
          Talk Your Dumb Idea Into Existence :)
        </p>
        <div className="w-16 h-[2px] bg-white/30 my-4 rounded-full" />
      </section>

      {/* Video Demo Placeholder */}
      {/* <section className="w-full max-w-md mx-auto mt-10">
        <div className="aspect-video bg-white/5 border border-white/10 rounded-xl shadow-lg overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/K27diMbCsuw?si=L-JHUPKTHUXTTri1" // replace with your demo
            title="Demo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </section> */}
      <section className="w-full max-w-md mx-auto mt-10">
        <div className="aspect-video bg-white/5 border border-white/10 rounded-xl shadow-lg overflow-hidden flex items-center justify-center">
          <img
            src="/images/img.png" // or /images/unicorn-idea-equation.png
            alt="Unicorn Idea Equation"
            className=" w-full h-full"
          />
        </div>
      </section>

      {/* CTA Button */}
      <section className="mt-8 flex justify-center">
        <SignedOut>
          <SignUpButton forceRedirectUrl="/dashboard">
            <Button className="text-md px-6 py-2 rounded-md bg-primary hover:bg-primary/80 transition">
              Get Started
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </SignedIn>
      </section>

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
    </main>
  );
}
