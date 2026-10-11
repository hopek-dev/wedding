import Image from "next/image";
import { Reveal } from "@/components/site/reveal";
import type { Photo } from "@/lib/site-photos";

// A photograph between sections, with no text on it: a moment to look before reading on. Takes a photo from
// the Photos page (see src/lib/site-photos.ts).
//
// A wide photo runs the full width of the page and is as tall as it needs to be, so it is shown whole. Only if
// that would be much taller than the screen is it cropped, and then only by a little: the height stops at
// 1.2 screens. The crop keeps the part chosen on the Photos page (by default the top, so heads are never cut).
//
// An upright photo (taller than wide) is handled differently, because stretching it across a wide screen would
// enlarge and crop it badly. On an upright screen (a phone) it simply fills the width, whole. On a wide screen
// it is shown at nearly the full screen height, not enlarged, with a soft blurred copy of itself filling the
// sides and its edges faded into that.
export function PhotoBand({ photo }: { photo: Photo }) {
  const { src, alt, ratio, focus } = photo;
  const position = { objectPosition: `${focus.x}% ${focus.y}%` };
  if (ratio < 1) {
    return (
      <Reveal threshold={0}>
        <div className="relative w-full landscape:hidden" style={{ aspectRatio: String(ratio) }}>
          <Image src={src} alt={alt} fill quality={90} sizes="100vw" className="object-cover" />
        </div>
        <div className="relative hidden h-[92svh] w-full overflow-hidden bg-secondary landscape:block">
          <Image src={src} alt="" aria-hidden fill sizes="30vw" className="scale-125 object-cover opacity-90 blur-3xl" />
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)]"
            style={{ width: `min(100%, calc(92svh * ${ratio}))` }}
          >
            <Image src={src} alt={alt} fill quality={90} sizes="70vw" className="object-cover" />
          </div>
        </div>
      </Reveal>
    );
  }
  return (
    <Reveal threshold={0}>
      <div className="relative w-full overflow-hidden bg-secondary" style={{ aspectRatio: String(ratio), maxHeight: "120svh" }}>
        <Image src={src} alt={alt} fill quality={90} sizes="100vw" className="object-cover" style={position} />
      </div>
    </Reveal>
  );
}
