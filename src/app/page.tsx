import Link from "next/link";
import { Phone, Headphones, Music2, Activity } from "lucide-react";
import { config } from "@/lib/config";

const features = [
  {
    icon: <Music2 size={20} />,
    title: "Song loading",
    body: "Walks through documented download and loading errors so the set is ready before rehearsal.",
  },
  {
    icon: <Headphones size={20} />,
    title: "Audio output",
    body: "Helps pick the right output device and routing when tracks are not coming through.",
  },
  {
    icon: <Activity size={20} />,
    title: "Version-aware",
    body: "Checks the caller's Playback version against the live App Store listing and documented release notes.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30">
            <span className="ml-0.5 block h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-white" />
          </span>
          <span className="text-lg font-medium tracking-tight">Playback Support</span>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-muted">
          Demo · not affiliated with MultiTracks
        </span>
      </header>

      <section className="mt-20 flex flex-col items-start gap-6 sm:mt-28">
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
          Inbound support,
          <br />
          answered by voice.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          An AI phone agent that helps Playback users fix song-loading and
          audio-output problems before rehearsal or service. Built for a
          Regal AI Product Specialist take-home.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/call"
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
          >
            <Phone size={18} /> Start a browser call
          </Link>
          {config.inboundNumber ? (
            <a
              href={`tel:${config.inboundNumber.replace(/[^\d+]/g, "")}`}
              className="rounded-full border border-white/20 px-6 py-3 text-base text-white/90 transition hover:bg-white/5"
            >
              Or call {config.inboundNumber}
            </a>
          ) : (
            <span className="rounded-full border border-dashed border-white/15 px-6 py-3 text-base text-muted">
              Phone number coming soon
            </span>
          )}
        </div>
      </section>

      <section className="mt-24 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-white/10 bg-surface p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-accent">
              {f.icon}
            </div>
            <h2 className="mt-4 text-base font-medium">{f.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="mt-auto pt-20 text-xs text-muted">
        Transfers, staffing, and callbacks in this demo are simulated. Playback
        is a product of MultiTracks.com.
      </footer>
    </main>
  );
}
