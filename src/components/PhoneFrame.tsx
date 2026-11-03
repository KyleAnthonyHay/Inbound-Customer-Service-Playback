"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const LOGICAL_W = 440;
const LOGICAL_H = 956;

/** A box that scales a fixed 440x956 logical screen to fit itself. */
function FitScreen({ className, children }: { className: string; children: React.ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setScale(Math.min(width / LOGICAL_W, height / LOGICAL_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={boxRef} className={className}>
      <div
        className="absolute left-1/2 top-0 origin-top"
        style={{ width: LOGICAL_W, height: LOGICAL_H, transform: `translateX(-50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * iPhone frame from /public/iphone-frame.webp (980x2000, transparent screen
 * opening). Measured opening: 5.1% inset left/right, 2.2% top/bottom, corner
 * radius ~13% of the opening width, and exactly the 440x956 screen ratio.
 * The screen renders on top of the frame, clipped to that opening, so the
 * app's own Dynamic Island shows instead of the one baked into the image.
 * The framed phone shows at every viewport size (phones included), sized to
 * fit the window's height and width, so the page itself never scrolls.
 */
/** Large-screen right padding that keeps the phone centered beside the open activity panel (widths match ActivityPanel). */
const SHIFTED = "lg:pl-24 lg:pr-[560px] xl:pl-0 xl:pr-[640px]";

export function PhoneFrame({ children, shifted = false }: { children: React.ReactNode; shifted?: boolean }) {
  return (
    <div
      className={`flex h-[100dvh] items-center justify-center overflow-hidden bg-[#0b0b0c] px-4 transition-[padding] duration-300 ${shifted ? SHIFTED : ""}`}
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 64px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
    >
      {/* Height-limited, and on narrow screens width-limited (980/2000 aspect ratio). */}
      <div className="relative" style={{ height: "min(100%, 1000px, calc((100vw - 32px) * 2000 / 980))", aspectRatio: "980 / 2000" }}>
        <Image src="/iphone-frame.webp" alt="" fill priority sizes="500px" className="pointer-events-none select-none object-contain" />
        <FitScreen className="absolute inset-[2.2%_5.1%] overflow-hidden rounded-[13%/6%] bg-[#242424]">{children}</FitScreen>
      </div>
    </div>
  );
}
