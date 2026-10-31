"use client";

import { useEffect, useRef, useState } from "react";

const LOGICAL_W = 430;
const LOGICAL_H = 932;

/**
 * iPhone-style device frame drawn in CSS, proportioned to a 974x2000 reference
 * (bezel ~2.4% of width, screen corner radius ~11% of width). On narrow
 * viewports the frame is dropped and the screen fills the window.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / LOGICAL_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <>
      {/* Phone-size viewports: no frame */}
      <div className="h-[100dvh] w-full sm:hidden">{children}</div>

      {/* Larger viewports: framed */}
      <div className="hidden min-h-[100dvh] items-center justify-center bg-[#0b0b0c] py-6 sm:flex">
        <div
          className="relative"
          style={{ height: "min(92dvh, 960px)", aspectRatio: "974 / 2000" }}
        >
          {/* Side buttons */}
          <span aria-hidden className="absolute -left-[0.5%] top-[18.6%] h-[2.6%] w-[0.8%] rounded-l-[2px] bg-[#2a2a2c] shadow-[inset_1px_0_0_rgba(255,255,255,0.15)]" />
          <span aria-hidden className="absolute -left-[0.5%] top-[25.4%] h-[5.2%] w-[0.8%] rounded-l-[2px] bg-[#2a2a2c] shadow-[inset_1px_0_0_rgba(255,255,255,0.15)]" />
          <span aria-hidden className="absolute -left-[0.5%] top-[32.6%] h-[5.2%] w-[0.8%] rounded-l-[2px] bg-[#2a2a2c] shadow-[inset_1px_0_0_rgba(255,255,255,0.15)]" />
          <span aria-hidden className="absolute -right-[0.5%] top-[27.8%] h-[8.4%] w-[0.8%] rounded-r-[2px] bg-[#2a2a2c] shadow-[inset_-1px_0_0_rgba(255,255,255,0.15)]" />

          {/* Body / bezel */}
          <div
            className="absolute inset-0 rounded-[11.5%/5.6%] bg-[#151516] shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #3a3a3c 0%, #1c1c1e 8%, #1c1c1e 92%, #3a3a3c 100%)",
              boxShadow:
                "inset 0 0 0 2px #4a4a4d, inset 0 0 0 4px #0e0e0f, 0 30px 80px rgba(0,0,0,0.6)",
            }}
          />

          {/* Screen */}
          <div ref={screenRef} className="absolute inset-[1.1%_2.6%] overflow-hidden rounded-[10%/5%] bg-black">
            {/* True 430x932 logical screen, scaled to the frame opening */}
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{ width: LOGICAL_W, height: LOGICAL_H, transform: `scale(${scale})` }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
