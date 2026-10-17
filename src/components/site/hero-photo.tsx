"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";

// A hero photograph that stays hidden until it has actually loaded, then fades in while easing out of a slight
// zoom (styles: site.css; with zoom={false} it only fades). Without this, the zoom ran while the picture was still downloading, so the photo
// popped in sharp and already settled, a moment after the page had appeared.
export function HeroPhoto({ className = "", zoom = true, ...props }: ImageProps & { zoom?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  // a photo that was already in the browser's cache can be finished before this component starts listening
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  return <Image {...props} ref={ref} onLoad={() => setLoaded(true)} className={`${zoom ? "hero-photo" : "hero-photo-fade"} ${loaded ? "is-loaded" : ""} ${className}`} />;
}
