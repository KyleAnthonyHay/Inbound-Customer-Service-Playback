import Link from "next/link";
import Image from "next/image";
import { Phone, ChevronRight, Download, Headphones, GitCompareArrows } from "lucide-react";
import { config } from "@/lib/config";

function Mark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-[22%] bg-current ${className}`} aria-hidden>
      <span className="ml-[6%] block h-0 w-0 border-y-[0.19em] border-l-[0.3em] border-y-transparent border-l-white" />
    </span>
  );
}

const prompts = [
  { icon: <Download size={18} />, text: "My song won't download" },
  { icon: <Headphones size={18} />, text: "No sound from my interface" },
  { icon: <GitCompareArrows size={18} />, text: "Is my version the problem?" },
];

export default function Home() {
  const number = config.inboundNumber;
  const tel = number ? `tel:${number.replace(/[^\d+]/g, "")}` : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#fbfaf8] text-[#1a1a1a]">
      <main className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Left: sign-in style entry */}
        <section className="relative flex flex-col items-center px-6 pb-16 pt-10 sm:px-12 lg:justify-center lg:pt-0">
          {/* faint watermark, like the reference */}
          <svg aria-hidden className="pointer-events-none absolute left-1/2 top-10 h-[132px] w-[132px] -translate-x-1/2 opacity-[0.06] lg:top-12" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="44" stroke="#1a1a1a" strokeWidth="7" />
            <path d="M41 32v36l30-18z" fill="#1a1a1a" />
          </svg>

          <div className="relative mt-28 w-full max-w-[424px] lg:mt-0">
            <h1 className="text-center text-[44px] leading-[1.05] tracking-[-0.01em] sm:text-[52px]" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
              Call Playback support
            </h1>
            <p className="mx-auto mt-4 max-w-[380px] text-center text-[15px] leading-relaxed text-[#555]">
              An AI assistant for MultiTracks Playback. Song-loading and audio-output help, grounded in the official docs.
            </p>

            <div className="mt-10 rounded-[6px] border border-[#d9d6d0] bg-white px-5 py-4">
              <p className="text-[12px] text-[#777]">Inbound test number</p>
              <p className={`mt-1 text-[17px] ${number ? "" : "text-[#9a9a9a]"}`}>{number || "Not provisioned yet"}</p>
            </div>

            <Link
              href="/call"
              className="mt-5 flex h-[64px] items-center justify-center rounded-[6px] bg-[#1a1a1a] text-[17px] text-white transition hover:bg-[#2b2b2b]"
            >
              Start a browser call
            </Link>

            <p className="mt-6 text-[15px] text-[#444]">
              {tel ? (
                <>
                  Prefer your phone?{" "}
                  <a href={tel} className="font-medium underline underline-offset-[3px]">
                    Call {number}
                  </a>
                </>
              ) : (
                <>
                  Prefer your phone? <span className="text-[#9a9a9a]">Number coming soon</span>
                </>
              )}
            </p>
            <p className="mt-2 text-[13px] text-[#8a8a8a]">
              Identifies itself as an AI. Transfers and callbacks are simulated.
            </p>
          </div>
        </section>

        {/* Right: warm backdrop with the laptop overflowing the corner */}
        <section className="relative min-h-[560px] overflow-hidden bg-[#1a120a] text-white lg:min-h-0">
          {/* CSS bokeh backdrop: warm stage light, blurred */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 70% 25%, rgba(255,176,84,0.55), transparent 70%)," +
                "radial-gradient(45% 40% at 25% 70%, rgba(214,120,40,0.5), transparent 70%)," +
                "radial-gradient(35% 30% at 85% 75%, rgba(255,120,60,0.35), transparent 70%)," +
                "radial-gradient(70% 60% at 50% 100%, rgba(80,40,20,0.9), transparent 70%)," +
                "linear-gradient(180deg, #2a1a0e 0%, #140c07 100%)",
            }}
          />
          <div aria-hidden className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(14px 14px at 20% 30%, rgba(255,210,150,0.35) 40%, transparent 41%), radial-gradient(10px 10px at 62% 18%, rgba(255,220,170,0.3) 40%, transparent 41%), radial-gradient(18px 18px at 78% 42%, rgba(255,190,120,0.25) 40%, transparent 41%), radial-gradient(9px 9px at 40% 58%, rgba(255,230,190,0.3) 40%, transparent 41%), radial-gradient(12px 12px at 90% 20%, rgba(255,200,140,0.3) 40%, transparent 41%)", filter: "blur(6px)" }} />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          <div className="relative flex h-full flex-col px-8 pt-10 sm:px-12 lg:pl-[12%] lg:pt-[9%]">
            <p className="flex items-center gap-3 text-[19px] text-white/85 sm:text-[26px]">
              <Mark className="h-[26px] w-[26px] text-white/90" />
              Grounded in MultiTracks docs
              <ChevronRight size={20} className="text-white/60" />
            </p>

            {/* Laptop: cut off at the bottom-right, like the card in the reference */}
            <div className="relative mt-8 flex-1">
              <Image
                src="/playback-laptop.webp"
                alt="Playback running a Sunday setlist on a MacBook"
                width={1448}
                height={1086}
                priority
                sizes="(min-width: 1024px) 60vw, 120vw"
                className="absolute left-0 top-0 h-auto w-[135%] max-w-none drop-shadow-[0_40px_80px_rgba(0,0,0,0.55)] sm:w-[120%] lg:w-[128%]"
              />
            </div>

            {/* Example prompt chips, like the action chips in the reference */}
            <div className="relative -mx-8 mb-10 flex gap-3 overflow-x-auto px-8 pb-1 sm:-mx-12 sm:px-12 lg:-ml-[12%] lg:pl-[12%] [scrollbar-width:none]">
              {prompts.map((p) => (
                <Link
                  key={p.text}
                  href="/call"
                  className="flex shrink-0 items-center gap-3 rounded-[10px] border border-white/15 bg-black/35 px-5 py-3.5 text-[18px] text-white backdrop-blur-md transition hover:bg-black/50"
                >
                  {p.icon} {p.text}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="flex min-h-[72px] items-center justify-between bg-[#262626] px-6 py-4 text-white sm:px-10">
        <span className="flex items-center gap-2.5">
          <Mark className="h-[26px] w-[26px] text-white [&>span]:border-l-[#262626]" />
          <span className="whitespace-nowrap text-[18px] font-medium tracking-tight sm:text-[20px]">Playback Support</span>
        </span>
        <span className="ml-4 text-right text-[12px] leading-tight text-white/80 sm:text-[16px]">Demo, not affiliated with MultiTracks.com</span>
      </footer>
    </div>
  );
}
