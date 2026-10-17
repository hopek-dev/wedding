"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";

// A hero photograph. One that is already in the browser (cached, or preloaded) simply shows, so moving between
// pages never puts a pale cover over the hero. One that is still downloading when the page appears is hidden
// until it arrives, then fades in (styles: site.css).
export function HeroPhoto({ className = "", fadeOnly = false, ...props }: ImageProps & { fadeOnly?: boolean }) {
  const [state, setState] = useState<"ready" | "pending" | "loaded">("ready");
  // runs as the photo is attached to the page, before it is painted
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img && !(img.complete && img.naturalWidth > 0)) setState((s) => (s === "ready" ? "pending" : s));
  }, []);
  const base = fadeOnly ? "hero-photo-fade" : "hero-photo";
  return <Image {...props} ref={ref} onLoad={() => setState((s) => (s === "pending" ? "loaded" : s))} className={`${base} ${state === "pending" ? "is-pending" : state === "loaded" ? "is-loaded" : ""} ${className}`} />;
}
