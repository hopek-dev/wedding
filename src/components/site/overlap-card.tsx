"use client";

import { useEffect, useState, type ReactNode } from "react";

// The content card under a hero photo. At the top of the page it sits just below the photo, so the
// photo shows clean. As soon as the visitor scrolls, it slides up over the bottom of the photo.
// It moves with a transform, so nothing else on the page shifts. Stands still for "reduced motion".
export function OverlapCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [over, setOver] = useState(false);
  useEffect(() => {
    const on = () => setOver(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div
      className={`transition-transform duration-700 ease-out motion-reduce:transition-none ${over ? "-translate-y-16 md:-translate-y-24" : "translate-y-0"} ${className}`}
    >
      {children}
    </div>
  );
}
