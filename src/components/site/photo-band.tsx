import Image from "next/image";
import { Reveal } from "@/components/site/reveal";

// A photograph between sections, with no text on it: a moment to look before reading on.
//
// A wide photo runs the full width of the page and is as tall as it needs to be (pass the photo's width divided
// by its height as `ratio`), so it is shown whole. Only if that would be much taller than the screen is it
// cropped, and then only by a little: the height stops at 1.2 screens. Any cropping is taken off the bottom,
// so heads at the top of a photo are never cut (pass `pos` to choose a different part to keep).
//
// An upright photo (ratio below 1) is handled differently, because stretching it across a wide screen would
// enlarge and crop it badly. On an upright screen (a phone) it simply fills the width, whole. On a wide screen
// it is shown at nearly the full screen height, not enlarged, with a soft blurred copy of itself filling the
// sides and its edges faded into that.
export function PhotoBand({ src, alt, ratio, pos = "object-top" }: { src: string; alt: string; ratio: number; pos?: string }) {
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
        <Image src={src} alt={alt} fill sizes="100vw" className={`object-cover ${pos}`} />
      </div>
    </Reveal>
  );
}
