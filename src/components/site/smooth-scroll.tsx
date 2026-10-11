"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Eased, gentle scrolling for the public wedding site (Lenis). It only smooths a mouse wheel or
// trackpad; on a phone or tablet the page keeps its own native touch scrolling. It stands aside
// for visitors who ask for reduced motion. In-page links (#...) glide too.
// Anything that must scroll or lock on its own (a pop-up) carries data-lenis-prevent.
let instance: Lenis | null = null;

// Jump to the top with no easing (used while a page is invisible between two pages).
export function jumpToTop() {
  if (instance) instance.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      wheelMultiplier: 1,
      anchors: true, // each target already keeps clear of the fixed header with scroll-mt
    });
    instance = lenis;
    return () => {
      lenis.destroy();
      instance = null;
    };
  }, []);
  return null;
}
