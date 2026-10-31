import Link from "next/link";
import Image from "next/image";
import { Phone, Music2, Headphones, GitCompareArrows, ArrowRight } from "lucide-react";
import { config } from "@/lib/config";

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-[6px] ${dark ? "bg-white" : "bg-[#1a1a1a]"}`}>
        <span className={`ml-[2px] block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent ${dark ? "border-l-[#1a1a1a]" : "border-l-white"}`} />
      </span>
      <span className="whitespace-nowrap text-[20px] font-medium tracking-tight sm:text-[22px]">Playback Support</span>
    </span>
  );
}

const features = [
  {
    icon: <Music2 size={18} />,
    title: "Song loading",
    body: "Walks through MultiTracks' documented download and loading errors, one step at a time, and checks each one worked.",
  },
  {
    icon: <Headphones size={18} />,
    title: "Audio output",
    body: "Helps pick the right output device and routing when tracks, click, or guide are not coming through.",
  },
  {
    icon: <GitCompareArrows size={18} />,
    title: "Version-aware",
    body: "Reads the live App Store listing and the published release notes, so advice depends on the version you actually have.",
  },
];

export default function Home() {
  const number = config.inboundNumber;
  const tel = number ? `tel:${number.replace(/[^\d+]/g, "")}` : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-[#1a1a1a]">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="Playback Support home">
          <Logo />
        </Link>
        <Link
          href="/call"
          className="hidden items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#333] sm:flex"
        >
          <Phone size={14} /> Start a call
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 pb-8 pt-8 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6 lg:pb-16 lg:pt-14">
            <div className="max-w-[560px]">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#e3f3fb] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-[#205773]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#43b1e6]" /> AI voice agent demo
              </p>
              <h1 className="mt-5 text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[52px] lg:text-[56px]">
                Playback support that answers the phone.
              </h1>
              <p className="mt-5 text-[17px] leading-relaxed text-[#444] sm:text-[19px]">
                Call it when a song won&apos;t load or audio isn&apos;t coming through. It troubleshoots from
                MultiTracks&apos; own documentation, checks your Playback version against the App Store, and hands you
                to a person when it should.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/call"
                  className="flex h-[56px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1a1a1a] px-7 text-[17px] font-medium text-white transition hover:bg-[#333]"
                >
                  Start a browser call <ArrowRight size={18} />
                </Link>
                {tel ? (
                  <a
                    href={tel}
                    className="flex h-[56px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#f1f2f3] px-7 text-[17px] font-medium text-[#1a1a1a] transition hover:bg-[#e6e8ea]"
                  >
                    <Phone size={18} /> Call {number}
                  </a>
                ) : (
                  <span className="flex h-[56px] cursor-not-allowed items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#f1f2f3] px-7 text-[17px] font-medium text-[#9a9a9a]">
                    <Phone size={18} /> Phone number coming soon
                  </span>
                )}
              </div>

              <p className="mt-5 text-[13px] text-[#777]">
                Identifies itself as an AI. Transfers and callbacks are simulated. Not affiliated with MultiTracks.com.
              </p>
            </div>

            {/* Laptop */}
            <div className="relative -mx-5 sm:mx-0 lg:-mr-16">
              <div className="pointer-events-none absolute inset-x-[10%] bottom-[6%] top-[20%] rounded-full bg-[#43b1e6]/15 blur-3xl" aria-hidden />
              <Image
                src="/playback-laptop.webp"
                alt="Playback running a Sunday setlist on a MacBook"
                width={1448}
                height={1086}
                priority
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="relative h-auto w-full"
              />
            </div>
          </div>
        </section>

        {/* What it handles */}
        <section className="bg-[#f1f2f3]">
          <div className="mx-auto grid w-full max-w-[1200px] gap-4 px-5 py-12 sm:grid-cols-3 sm:px-8 lg:py-16">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-black/[0.06] bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3f3fb] text-[#205773]">{f.icon}</span>
                <h2 className="mt-4 text-[17px] font-semibold">{f.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[#555]">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scope note */}
        <section className="mx-auto w-full max-w-[1200px] px-5 py-12 sm:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-[26px] font-bold tracking-tight">In scope, out of scope</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-[#555]">
                It handles the two problems that stop a rehearsal: songs that won&apos;t load and audio that
                won&apos;t come out. Billing, refunds, sales, and account changes are out of scope. It will say
                so, point to the right team, and offer a handoff or a callback instead of guessing.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-[15px]">
              <div>
                <dt className="font-semibold">Knowledge</dt>
                <dd className="mt-1 text-[#555]">MultiTracks help center articles and release notes, with source links.</dd>
              </div>
              <div>
                <dt className="font-semibold">Live data</dt>
                <dd className="mt-1 text-[#555]">Current Playback version from Apple&apos;s public App Store lookup.</dd>
              </div>
              <div>
                <dt className="font-semibold">Handoff</dt>
                <dd className="mt-1 text-[#555]">Simulated team availability, transfer, and callback booking.</dd>
              </div>
              <div>
                <dt className="font-semibold">Voice</dt>
                <dd className="mt-1 text-[#555]">Vapi with OpenAI GPT-Live, browser and phone.</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <footer className="flex min-h-[72px] items-center justify-between bg-[#1e1e1e] px-5 py-4 text-white sm:px-8">
        <Logo dark />
        <span className="ml-4 text-right text-[12px] leading-tight text-white/80 sm:text-[15px]">Demo, not affiliated with MultiTracks.com</span>
      </footer>
    </div>
  );
}
