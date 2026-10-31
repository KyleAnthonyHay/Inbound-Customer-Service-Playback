import Link from "next/link";
import Image from "next/image";
import { config } from "@/lib/config";

export default function Home() {
  const number = config.inboundNumber;
  const tel = number ? `tel:${number.replace(/[^\d+]/g, "")}` : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#fbfaf8] text-[#1a1a1a]">
      <main className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Left: sign-in style entry */}
        <section className="relative flex flex-col items-center px-4 pb-10 pt-8 sm:px-12 sm:pt-12 lg:justify-center lg:pt-0">
          <div className="relative w-full max-w-[424px]">
            {/* Official Playback logo, inverted for the light column */}
            <Image
              src="/playback-full-logo-white.svg"
              alt="Playback"
              width={116}
              height={34}
              priority
              className="mx-auto h-[34px] w-auto brightness-0"
            />
            <h1 className="mt-6 text-center text-[32px] font-semibold leading-[1.1] tracking-tight sm:mt-8 sm:text-[42px]">
              Call Playback support
            </h1>
            <p className="mx-auto mt-3 max-w-[380px] text-center text-[16px] leading-relaxed text-[#555] sm:mt-4 sm:text-[15px]">
              An AI assistant for MultiTracks Playback. Song-loading and audio-output help, grounded in the official docs.
            </p>

            <Link
              href="/call"
              className="mt-8 flex h-[56px] items-center justify-center rounded-[8px] bg-[#1a1a1a] text-[17px] font-medium text-white transition hover:bg-[#2b2b2b] sm:mt-10 sm:h-[64px] sm:rounded-[6px]"
            >
              Start a browser call
            </Link>

            <div className="mt-4 rounded-[8px] border border-[#d9d6d0] bg-white px-4 py-3 sm:mt-5 sm:rounded-[6px] sm:px-5 sm:py-4">
              <p className="text-[12px] text-[#777]">Inbound test number</p>
              <p className={`mt-0.5 text-[17px] ${number ? "" : "text-[#9a9a9a]"}`}>{number || "Not provisioned yet"}</p>
            </div>

            <p className="mt-5 text-[16px] text-[#444] sm:mt-6 sm:text-[15px]">
              {tel ? (
                <>
                  Prefer your phone?{" "}
                  <a href={tel} className="inline-block min-h-[44px] py-2 font-medium underline underline-offset-[3px]">
                    Call {number}
                  </a>
                </>
              ) : (
                <>
                  Prefer your phone? <span className="text-[#9a9a9a]">Number coming soon</span>
                </>
              )}
            </p>
            <p className="mt-2 text-[13px] text-[#8a8a8a]">Identifies itself as an AI. Transfers and callbacks are simulated.</p>
          </div>
        </section>

        {/* Right: MultiTracks brand blue with the laptop overflowing the corner */}
        <section className="relative min-h-[360px] overflow-hidden text-white sm:min-h-[520px] lg:min-h-0" style={{ background: "linear-gradient(160deg, #43b1e6 0%, #2f93c6 45%, #205773 100%)" }}>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(55% 45% at 75% 20%, rgba(255,255,255,0.22), transparent 70%)," +
                "radial-gradient(40% 35% at 20% 80%, rgba(227,243,251,0.18), transparent 70%)," +
                "radial-gradient(70% 60% at 50% 110%, rgba(19,52,68,0.6), transparent 70%)",
            }}
          />
          <div className="relative flex h-full flex-col px-4 pt-6 sm:px-12 sm:pt-10 lg:pl-[12%] lg:pt-[9%]">
            <Image src="/playback-full-logo-white.svg" alt="Playback" width={116} height={34} className="h-[30px] w-auto self-start opacity-95" />

            {/* Laptop: cut off at the bottom-right */}
            <div className="relative mt-5 min-h-[280px] flex-1 sm:mt-8 sm:min-h-[380px]">
              <Image
                src="/playback-laptop.webp"
                alt="Playback running a Sunday setlist on a MacBook"
                width={1448}
                height={1086}
                priority
                sizes="(min-width: 1024px) 60vw, 120vw"
                className="absolute left-[4%] top-0 h-auto w-[125%] max-w-none drop-shadow-[0_40px_80px_rgba(0,0,0,0.45)] sm:left-0 sm:w-[120%] lg:w-[128%]"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="flex min-h-[64px] items-center justify-between bg-[#133444] px-4 py-3 text-white sm:min-h-[72px] sm:px-10" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <Image src="/logo-white.svg" alt="MultiTracks" width={218} height={32} className="h-[22px] w-auto sm:h-[26px]" />
        <span className="ml-4 text-right text-[12px] leading-tight text-white/80 sm:text-[15px]">Demo, not affiliated with MultiTracks.com</span>
      </footer>
    </div>
  );
}
