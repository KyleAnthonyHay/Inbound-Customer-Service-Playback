import Link from "next/link";
import Image from "next/image";
import { Phone } from "lucide-react";
import { config } from "@/lib/config";

function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] bg-current">
        <span className="ml-[2px] block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white [.dark_&]:border-l-black" />
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
          <Link href="/" aria-label="Playback Support home" className="w-fit text-black">
            <Logo />
          </Link>

          <div className="mx-auto mt-24 w-full max-w-[780px] lg:mt-0 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:pl-[60px] lg:pr-[40px]">
            <h1 className="text-[32px] font-bold leading-[1.15] tracking-tight">Start a call</h1>

            <details className="group mt-3 text-[18px] text-[#1a1a1a]">
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
              <p className={`mt-1.5 text-[18px] leading-tight ${number ? "" : "text-[#777]"}`}>
                {number || "Not provisioned yet"}
              </p>
            </div>

            <Link
              href="/call"
              className="mt-11 flex h-[60px] items-center justify-center rounded-full bg-black text-[18px] font-medium text-white transition hover:bg-[#222]"
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
                className="flex h-[60px] items-center justify-center gap-2.5 rounded-full bg-[#f0f0f0] text-[18px] font-medium text-black transition hover:bg-[#e8e8e8]"
              >
                <Phone size={20} /> Call from your phone
              </a>
            ) : (
              <span
                aria-disabled
                className="flex h-[60px] cursor-not-allowed items-center justify-center gap-2.5 rounded-full bg-[#f0f0f0] text-[18px] font-medium text-[#9a9a9a]"
              >
                <Phone size={20} /> Call from your phone (number coming soon)
              </span>
            )}
          </div>
        </section>

        {/* Right: image panel on MultiTracks' light gray */}
        <section className="hidden bg-[#f1f2f3] p-8 lg:block">
        <div className="relative h-full min-h-[560px] overflow-hidden rounded-[18px] border border-black/[0.06] bg-white shadow-[0_18px_50px_rgba(32,87,115,0.12)]">
          <Image
            src="/playback-hero.webp"
            alt="Playback multitrack player on an iPad"
            fill
            priority
            sizes="50vw"
            className="object-cover object-[50%_0%]"
          />
          {/* Card, like the loyalty card in the reference */}
          <div className="absolute bottom-10 left-1/2 w-[min(440px,86%)] -translate-x-1/2 rounded-[22px] bg-white p-[14px] text-[#1a1a1a] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="rounded-[14px] border border-black/[0.06] bg-white">
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#43b1e6] text-white">
                    <Phone size={18} />
                  </span>
                  <span className="text-[18px] font-semibold">Playback Support</span>
                </span>
                <span className="text-right">
                  <span className="block text-[11px] font-semibold tracking-wide text-[#666]">AGENT</span>
                  <span className="block text-[16px]">AI, says so first</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-px bg-[#e3f3fb] px-5 py-5 text-center text-[13px] font-medium text-[#205773]">
                <span>Song loading</span>
                <span>Audio output</span>
                <span>Version check</span>
              </div>
              <div className="grid grid-cols-2 px-5 pt-4 pb-5 text-center">
                <span>
                  <span className="block text-[11px] font-semibold tracking-wide text-[#666]">HANDOFF</span>
                  <span className="block text-[16px]">Simulated</span>
                </span>
                <span>
                  <span className="block text-[11px] font-semibold tracking-wide text-[#666]">VERSION DATA</span>
                  <span className="block text-[16px]">Live App Store</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        </section>
      </main>

      <footer className="flex h-[82px] items-center justify-between bg-[#1e1e1e] px-8 text-white sm:px-14 lg:px-[60px]">
        <span className="dark">
          <Logo />
        </span>
        <span className="ml-4 text-right text-[12px] leading-tight text-white/80 sm:text-[18px]">Demo, not affiliated with MultiTracks.com</span>
      </footer>
    </div>
  );
}
