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
        <section className="relative flex flex-col items-center px-6 pb-16 pt-12 sm:px-12 lg:justify-center lg:pt-0">
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
            <h1 className="mt-8 text-center text-[36px] font-semibold leading-[1.1] tracking-tight sm:text-[42px]">
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
            <p className="mt-2 text-[13px] text-[#8a8a8a]">Identifies itself as an AI. Transfers and callbacks are simulated.</p>
          </div>
        </section>

        {/* Right: MultiTracks brand blue with the laptop overflowing the corner */}
        <section className="relative min-h-[520px] overflow-hidden text-white lg:min-h-0" style={{ background: "linear-gradient(160deg, #43b1e6 0%, #2f93c6 45%, #205773 100%)" }}>
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
          <div className="relative flex h-full flex-col px-8 pt-10 sm:px-12 lg:pl-[12%] lg:pt-[9%]">
            <Image src="/playback-full-logo-white.svg" alt="Playback" width={116} height={34} className="h-[30px] w-auto self-start opacity-95" />

            {/* Laptop: cut off at the bottom-right */}
            <div className="relative mt-8 min-h-[380px] flex-1">
              <Image
                src="/playback-laptop.webp"
                alt="Playback running a Sunday setlist on a MacBook"
                width={1448}
                height={1086}
                priority
                sizes="(min-width: 1024px) 60vw, 120vw"
                className="absolute left-0 top-0 h-auto w-[135%] max-w-none drop-shadow-[0_40px_80px_rgba(0,0,0,0.45)] sm:w-[120%] lg:w-[128%]"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="flex min-h-[72px] items-center justify-between bg-[#133444] px-6 py-4 text-white sm:px-10">
        <Image src="/logo-white.svg" alt="MultiTracks" width={218} height={32} className="h-[22px] w-auto sm:h-[26px]" />
        <span className="ml-4 text-right text-[12px] leading-tight text-white/80 sm:text-[15px]">Demo, not affiliated with MultiTracks.com</span>
      </footer>
    </div>
  );
}
