"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Pause } from "lucide-react";

// Continuously rolling hero: one row of landscape photos glides from right to left, forever,
// with no pause and no jump. The photos are listed twice side by side and the row slides left
// by exactly one list's width, so the copy lines up where the original started and the loop
// is seamless. The movement is CSS (see site.css); the only script sets how long one loop
// takes so the speed is the same number of pixels per second on every screen size.
// Honours "reduced motion" by standing still. Clicking (or tapping, or pressing Enter on) the photos pauses
// them; clicking again carries on. Just hovering over them does nothing.
export interface Slide {
  src: string;
  alt: string;
  focus?: { x: number; y: number }; // which part to keep when cropped, in percent, to keep faces in frame
}

// How fast the row moves, in pixels per second.
const SPEED_PX_PER_SECOND = 54;

export function HeroSlideshow({ slides }: { slides: Slide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const apply = () => {
      const oneList = el.scrollWidth / 2 + 1.5; // the distance the animation travels
      el.style.setProperty("--loop", `${(oneList / SPEED_PX_PER_SECOND).toFixed(2)}s`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const row = (copy: number) =>
    slides.map((s, i) => (
      <div key={`${copy}-${s.src}`} className="hero-tile relative h-full shrink-0 overflow-hidden" aria-hidden={copy === 1}>
        <Image
          src={s.src}
          alt={copy === 0 ? s.alt : ""}
          fill
          priority={copy === 0 && i < 2}
          sizes="(min-width: 768px) 1300px, 130vw"
          className="object-cover"
          style={{ objectPosition: `${s.focus?.x ?? 50}% ${s.focus?.y ?? 50}%` }}
        />
      </div>
    ));

  return (
    <section
      role="button"
      tabIndex={0}
      aria-pressed={paused}
      onClick={() => setPaused((p) => !p)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setPaused((p) => !p);
        }
      }}
      data-paused={paused || undefined}
      className="hero-marquee relative cursor-pointer h-[100svh] min-h-[520px] w-full overflow-hidden bg-white portrait:h-[66svh] portrait:min-h-[440px]"
      aria-label="Photos of Vanessa and Hope. Click to pause or carry on."
    >
      <div ref={track} className="hero-track flex h-full w-max gap-[3px]">
        {row(0)}
        {row(1)}
      </div>
      {/* a soft shade at the bottom so the card below feels attached, and a thin line hinting that the page continues */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/25 to-transparent" />
      {paused && (
        <span aria-hidden className="pointer-events-none absolute right-5 bottom-6 grid size-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm">
          <Pause className="size-4 fill-current" strokeWidth={0} />
        </span>
      )}
      <div aria-hidden className="scroll-cue absolute bottom-7 left-1/2 h-14 w-px -translate-x-1/2" />
    </section>
  );
}
