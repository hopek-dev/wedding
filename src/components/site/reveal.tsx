"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Fades its content in once it scrolls into view (styles: site.css).
export function Reveal({ children, delay, className = "", threshold = 0.12 }: { children: ReactNode; delay?: 1 | 2 | 3; className?: string; threshold?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} data-delay={delay}>
      {children}
    </div>
  );
}
