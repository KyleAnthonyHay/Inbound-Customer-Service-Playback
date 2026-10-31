import Link from "next/link";
import Image from "next/image";
import { Phone } from "lucide-react";
import { config } from "@/lib/config";

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-[6px] ${dark ? "bg-white" : "bg-[#1a1a1a]"}`}>
        <span className={`ml-[2px] block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent ${dark ? "border-l-[#1a1a1a]" : "border-l-white"}`} />
      </span>
      <span className="whitespace-nowrap text-[22px] font-medium tracking-tight">Playback Support</span>
    </span>
  );
}

export default function Home() {
  const number = config.inboundNumber;
  const tel = number ? `tel:${number.replace(/[^\d+]/g, "")}` : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-[#1a1a1a]">
      <main className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Left: entry form */}
        <section className="relative flex flex-col px-8 pb-12 pt-8 sm:px-14 lg:px-[60px]">
          <Link href="/" aria-label="Playback Support home" className="w-fit">
            <Logo />
          </Link>

          <div className="mx-auto mt-20 w-full max-w-[780px] lg:mt-0 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:pl-[60px] lg:pr-[40px]">
            <h1 className="text-[32px] font-bold leading-[1.15] tracking-tight">Start a call</h1>

            <details className="group mt-3 text-[18px]">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                New here?{" "}
                <span className="font-medium underline decoration-[1.5px] underline-offset-[3px]">What this agent handles</span>
              </summary>
              <p className="mt-3 max-w-[640px] text-[16px] leading-relaxed text-[#444]">
                An AI assistant for MultiTracks Playback. It helps when songs won&apos;t load or audio isn&apos;t coming
                through, checks your Playback version against the live App Store listing, and hands you to a person or
                books a callback when it should. Billing, refunds, and sales are out of scope.
              </p>
            </details>

            <div className="mt-7 rounded-[8px] border border-[#cfcfcf] px-5 py-4">
              <p className="text-[15px] font-semibold leading-tight">Inbound test number</p>
              <p className={`mt-1.5 text-[18px] leading-tight ${number ? "" : "text-[#777]"}`}>{number || "Not provisioned yet"}</p>
            </div>

            <Link
              href="/call"
              className="mt-11 flex h-[60px] items-center justify-center whitespace-nowrap rounded-full bg-black text-[18px] font-medium text-white transition hover:bg-[#222]"
            >
              Start a browser call
            </Link>

            <div className="my-9 flex items-center gap-4 text-[18px] text-[#444]">
              <span className="h-px flex-1 bg-[#e5e5e5]" />
              or
              <span className="h-px flex-1 bg-[#e5e5e5]" />
            </div>

            {tel ? (
              <a
                href={tel}
                className="flex h-[60px] items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-[#f0f0f0] text-[18px] font-medium text-black transition hover:bg-[#e8e8e8]"
              >
                <Phone size={20} /> Call from your phone
              </a>
            ) : (
              <span
                aria-disabled
                className="flex h-[60px] cursor-not-allowed items-center justify-center gap-2.5 rounded-full bg-[#f0f0f0] px-4 text-center text-[16px] font-medium text-[#9a9a9a] sm:text-[18px]"
              >
                <Phone size={20} /> Call from your phone (number coming soon)
              </span>
            )}
          </div>
        </section>

        {/* Right: laptop panel on MultiTracks' light gray */}
        <section className="hidden bg-[#f1f2f3] p-8 lg:block">
          <div className="relative flex h-full min-h-[600px] flex-col overflow-hidden rounded-[18px] border border-black/[0.06] bg-white shadow-[0_18px_50px_rgba(32,87,115,0.12)]">
            <div className="px-10 pt-10 text-center">
              <h2 className="text-[30px] font-bold leading-[1.15] tracking-tight xl:text-[34px]">
                Get the tracks ready before the service starts
              </h2>
              <p className="mx-auto mt-3 max-w-[520px] text-[17px] leading-snug text-[#555]">
                Phone support for Playback that fixes song-loading and audio-output problems, and knows when to bring in a
                person.
              </p>
            </div>

            {/* Laptop sits in its own band so it never overlaps the text */}
            <div className="relative mt-2 flex min-h-0 flex-1 items-center justify-center px-6">
              <div className="pointer-events-none absolute inset-x-[15%] bottom-[8%] top-[25%] rounded-full bg-[#43b1e6]/15 blur-3xl" aria-hidden />
              <Image
                src="/playback-laptop.webp"
                alt="Playback running a Sunday setlist on a MacBook"
                width={1448}
                height={1086}
                priority
                sizes="50vw"
                className="relative h-auto max-h-[min(44vh,520px)] w-auto max-w-full"
              />
            </div>

            {/* Card, like the loyalty card in the reference; overlaps only the laptop base */}
            <div className="relative mx-auto -mt-6 mb-8 w-[min(400px,80%)] rounded-[22px] bg-white p-[12px] text-[#1a1a1a] shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
              <div className="rounded-[14px] border border-black/[0.06] bg-white">
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#43b1e6] text-white">
                      <Phone size={18} />
                    </span>
                    <span className="text-[17px] font-semibold">Playback Support</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[11px] font-semibold tracking-wide text-[#666]">AGENT</span>
                    <span className="block text-[15px]">AI, says so first</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 bg-[#e3f3fb] px-5 py-4 text-center text-[13px] font-medium text-[#205773]">
                  <span>Song loading</span>
                  <span>Audio output</span>
                  <span>Version check</span>
                </div>
                <div className="grid grid-cols-2 px-5 pt-3 pb-4 text-center">
                  <span>
                    <span className="block text-[11px] font-semibold tracking-wide text-[#666]">HANDOFF</span>
                    <span className="block text-[15px]">Simulated</span>
                  </span>
                  <span>
                    <span className="block text-[11px] font-semibold tracking-wide text-[#666]">VERSION DATA</span>
                    <span className="block text-[15px]">Live App Store</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex min-h-[82px] items-center justify-between bg-[#1e1e1e] px-8 py-4 text-white sm:px-14 lg:px-[60px]">
        <Logo dark />
        <span className="ml-4 text-right text-[12px] leading-tight text-white/80 sm:text-[18px]">Demo, not affiliated with MultiTracks.com</span>
      </footer>
    </div>
  );
}
