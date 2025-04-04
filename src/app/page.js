"use client";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-white bg-black">
      <h1 className="text-3xl font-bold mb-6">
        Welcome to Late Night Ideas 🌙
      </h1>

      <SignedOut>
        <div className="flex gap-4">
          <SignInButton forceRedirectUrl="/dashboard" />
          <SignUpButton forceRedirectUrl="/dashboard" />
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-4">
          <UserButton />
          <Link href="/dashboard" className="underline text-blue-400">
            Go to Dashboard
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}
