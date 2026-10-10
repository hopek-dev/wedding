import Image from "next/image";

// Photo strip with thin white gutters, as at the top of the Joy site's welcome page.
// "hero" makes it fill most of the first screen.
const PHOTOS = [
  { src: "/site/lisbon.webp", alt: "Vanessa and Hope by a fountain in Lisbon", grow: "hidden md:block md:flex-[0.8]", pos: "object-[50%_30%]" },
  { src: "/site/blossom.webp", alt: "Vanessa and Hope among the blossom", grow: "flex-[1.4] md:flex-[1.6]", pos: "object-[50%_30%]" },
  { src: "/site/seaside.webp", alt: "Vanessa and Hope by the sea", grow: "flex-[1.4] md:flex-[1.6]", pos: "object-[45%_40%]" },
  { src: "/site/ring.webp", alt: "Their hands together, with an engagement ring", grow: "hidden md:block md:flex-[1.1]", pos: "object-center" },
];

export function PhotoStrip({ hero = false }: { hero?: boolean }) {
  return (
    <div className={`hero-photo flex gap-[3px] overflow-hidden bg-white ${hero ? "h-[62vh] min-h-[360px] md:h-[76vh] md:max-h-[820px]" : "h-44 sm:h-72"}`}>
      {PHOTOS.map((p, i) => (
        <div key={p.src} className={`relative min-w-0 overflow-hidden ${p.grow}`}>
          <Image src={p.src} alt={p.alt} fill priority={i < 3} sizes="(min-width: 768px) 35vw, 50vw" className={`object-cover ${p.pos}`} />
        </div>
      ))}
    </div>
  );
}
