"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

// Continuously rolling hero: one row of landscape photos glides from right to left, forever,
// with no pause and no jump. The photos are listed twice side by side and the row slides left
// by exactly one list's width, so the copy lines up where the original started and the loop
// is seamless. The movement is CSS (see site.css); the only script sets how long one loop
// takes so the speed is the same number of pixels per second on every screen size.
// Honours "reduced motion" by standing still, and pauses while the pointer is on it.
export interface Slide {
  src: string;
  alt: string;
  pos?: string; // CSS object-position, to keep faces in frame
}

// How fast the row moves, in pixels per second.
const SPEED_PX_PER_SECOND = 54;

export function HeroSlideshow({ slides }: { slides: Slide[] }) {
  const track = useRef<HTMLDivElement>(null);

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
          sizes="(min-width: 768px) 900px, 90vw"
          className={`object-cover ${s.pos ?? "object-center"}`}
        />
      </div>
    ));

  return (
    <section
      className="hero-marquee relative h-[40vh] min-h-[250px] w-full overflow-hidden bg-white md:h-[62vh] md:max-h-[640px]"
      aria-label="Photos of Vanessa and Hope"
    >
      <div ref={track} className="hero-track flex h-full w-max gap-[3px]">
        {row(0)}
        {row(1)}
      </div>
      {/* a soft shade at the bottom so the card below feels attached */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/25 to-transparent" />
    </section>
  );
}
