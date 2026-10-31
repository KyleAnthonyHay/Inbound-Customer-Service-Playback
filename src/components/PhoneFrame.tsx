"use client";

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
 * iPhone-style device frame drawn in CSS, proportioned to a 974x2000 reference
 * (bezel ~2.4% of width, screen corner radius ~11% of width). On narrow
 * viewports the frame is dropped and the screen fills the window.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Phone-size viewports: no frame */}
      <FitScreen className="relative h-[100dvh] w-full overflow-hidden bg-[#242424] sm:hidden">{children}</FitScreen>

      {/* Larger viewports: framed */}
      <div className="hidden min-h-[100dvh] items-center justify-center bg-[#0b0b0c] py-6 sm:flex">
        <div className="relative" style={{ height: "min(92dvh, 980px)", aspectRatio: "974 / 2000" }}>
          {/* Side buttons */}
          <span aria-hidden className="absolute -left-[0.5%] top-[18.6%] h-[2.6%] w-[0.8%] rounded-l-[2px] bg-[#2a2a2c] shadow-[inset_1px_0_0_rgba(255,255,255,0.15)]" />
          <span aria-hidden className="absolute -left-[0.5%] top-[25.4%] h-[5.2%] w-[0.8%] rounded-l-[2px] bg-[#2a2a2c] shadow-[inset_1px_0_0_rgba(255,255,255,0.15)]" />
          <span aria-hidden className="absolute -left-[0.5%] top-[32.6%] h-[5.2%] w-[0.8%] rounded-l-[2px] bg-[#2a2a2c] shadow-[inset_1px_0_0_rgba(255,255,255,0.15)]" />
          <span aria-hidden className="absolute -right-[0.5%] top-[27.8%] h-[8.4%] w-[0.8%] rounded-r-[2px] bg-[#2a2a2c] shadow-[inset_-1px_0_0_rgba(255,255,255,0.15)]" />

          {/* Body / bezel */}
          <div
            className="absolute inset-0 rounded-[11.5%/5.6%] bg-[#151516]"
            style={{
              backgroundImage: "linear-gradient(180deg, #3a3a3c 0%, #1c1c1e 8%, #1c1c1e 92%, #3a3a3c 100%)",
              boxShadow: "inset 0 0 0 2px #4a4a4d, inset 0 0 0 4px #0e0e0f, 0 30px 80px rgba(0,0,0,0.6)",
            }}
          />

          {/* Screen opening */}
          <FitScreen className="absolute inset-[1.1%_2.6%] overflow-hidden rounded-[10%/5%] bg-[#242424]">{children}</FitScreen>
        </div>
      </div>
    </>
  );
}
