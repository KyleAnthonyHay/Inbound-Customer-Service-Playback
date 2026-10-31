"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Shows the actual error instead of Next's generic "This page couldn't load". */
export default function CallError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[/call] crashed:", error);
  }, [error]);
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center text-white">
      <h1 className="text-lg font-semibold">The call page hit an error</h1>
      <p className="max-w-md break-words font-mono text-xs text-white/60">{error.message || "Unknown error"}{error.digest ? ` (${error.digest})` : ""}</p>
      <div className="flex gap-2">
        <button type="button" onClick={reset} className="rounded-full bg-white px-4 py-1.5 text-sm text-black">Try again</button>
        <Link href="/" className="rounded-full bg-white/10 px-4 py-1.5 text-sm">Home</Link>
      </div>
    </main>
  );
}
