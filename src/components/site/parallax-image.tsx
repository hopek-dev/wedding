"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

// A photograph that fills its box edge to edge and drifts a little slower than the page as you scroll,
// which gives the pictures depth. The picture is drawn slightly taller than its box so it has room to move.
// With `settle` it also eases in from a slight zoom when the page opens. Both stand still for "reduced motion".
export function ParallaxImage({
  src,
  alt,
  pos = "object-center",
  priority = false,
  settle = false,
  strength = 0.07,
  bleed = 7,
  sizes = "100vw",
}: {
  src: string;
  alt: string;
  pos?: string;
  priority?: boolean;
  settle?: boolean;
  strength?: number;
  bleed?: number; // percent of extra height above and below, the room the picture has to drift
  sizes?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = box.current;
    const pic = inner.current;
    if (!el || !pic) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const offset = r.top + r.height / 2 - window.innerHeight / 2;
      pic.style.transform = `translate3d(0, ${Math.round(-offset * strength)}px, 0)`; // whole pixels: a fractional shift softens the picture
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    // only follow the scroll while the picture is on screen
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        update();
        window.addEventListener("scroll", queue, { passive: true });
        window.addEventListener("resize", queue);
      } else {
        window.removeEventListener("scroll", queue);
        window.removeEventListener("resize", queue);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div ref={box} className="absolute inset-0 overflow-hidden">
      <div ref={inner} className="absolute inset-x-0 will-change-transform" style={{ top: `-${bleed}%`, bottom: `-${bleed}%` }}>
        <Image src={src} alt={alt} fill priority={priority} quality={90} sizes={sizes} className={`object-cover ${pos} ${settle ? "hero-settle" : ""}`} />
      </div>
    </div>
  );
}
