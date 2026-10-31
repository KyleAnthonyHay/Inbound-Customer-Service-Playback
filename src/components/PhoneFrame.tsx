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
 * On narrow viewports the frame is dropped and the screen fills the window
 * inside the device safe areas; the `.bare` class lets the screen hide its
 * drawn status bar, since the real phone shows its own.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Phone-size viewports: no frame */}
      <div className="bare h-[100dvh] w-full bg-[#242424] sm:hidden" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <FitScreen className="relative h-full w-full overflow-hidden">{children}</FitScreen>
      </div>

      {/* Larger viewports: framed */}
      <div className="hidden min-h-[100dvh] items-center justify-center bg-[#0b0b0c] py-6 sm:flex">
        <div className="relative" style={{ height: "min(92dvh, 1000px)", aspectRatio: "980 / 2000" }}>
          <Image src="/iphone-frame.webp" alt="" fill priority sizes="500px" className="pointer-events-none select-none object-contain" />
          <FitScreen className="absolute inset-[2.2%_5.1%] overflow-hidden rounded-[13%/6%] bg-[#242424]">{children}</FitScreen>
        </div>
      </div>
    </>
  );
}
