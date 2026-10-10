"use client";

import Image from "next/image";
import { useState } from "react";

// One photo card under the invitation. If its file isn't in public/couple/ the
// card quietly disappears instead of showing a broken image.
export function PhotoCard({ src, alt }: { src: string; alt: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <div className="inv-photo">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 512px) 512px, 92vw"
        className="object-cover object-[center_35%]"
        onError={() => setMissing(true)}
      />
    </div>
  );
}
