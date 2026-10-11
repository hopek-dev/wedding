import Link from "next/link";
import { MapPin } from "lucide-react";
import { Countdown } from "@/components/site/countdown";
import { HeroSlideshow, type Slide } from "@/components/site/hero-slideshow";
import { OverlapCard } from "@/components/site/overlap-card";
import { pill, pillOutline } from "@/components/site/page-shell";
import { eventDay } from "@/lib/public-site";
import { VENUE, WEDDING } from "@/lib/site-content";

export const metadata = { title: "Welcome" };

// The rolling hero photos, in the order they appear. Drop a new file in public/site/ and add it here.
const SLIDES: Slide[] = [
  { src: "/site/blossom.webp", alt: "Vanessa and Hope among the blossom", pos: "object-[50%_28%]" },
  { src: "/site/seaside.webp", alt: "Vanessa and Hope by the sea", pos: "object-[45%_40%]" },
  { src: "/site/lisbon.webp", alt: "Vanessa and Hope by a fountain in Lisbon", pos: "object-[50%_35%]" },
  { src: "/site/engagement.webp", alt: "Vanessa and Hope, laughing, showing her engagement ring", pos: "object-[58%_0%]" },
  { src: "/site/tower-bridge-wide.webp", alt: "Vanessa and Hope in front of Tower Bridge at night", pos: "object-[40%_10%]" },
  { src: "/site/palms.webp", alt: "Vanessa and Hope laughing together on a palm-lined beach", pos: "object-[50%_20%]" },
  { src: "/site/lake.webp", alt: "Vanessa and Hope laughing by the lake", pos: "object-[38%_30%]" },
];

export default function WelcomePage() {
  return (
    <>
      <HeroSlideshow slides={SLIDES} />
      {/* The card overlaps the bottom of the photos. */}
      <section className="relative z-10 mx-auto max-w-3xl px-4">
        <OverlapCard>
          <div className="bg-background px-6 py-12 text-center shadow-[0_20px_60px_-24px_rgba(70,62,30,0.35)] ring-1 ring-foreground/10 sm:px-14 sm:py-16">
            <p className="text-[12px] font-light tracking-[0.35em] text-muted-foreground uppercase">We&apos;re getting married</p>
            <h1 className="mt-4 text-3xl leading-snug font-light tracking-wide sm:text-5xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
              {WEDDING.welcome}
            </h1>
            <div className="ornament mt-7" aria-hidden>
              <i />
            </div>
            <p className="mt-7 text-xl font-light tracking-wide sm:text-2xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
              {eventDay(`${WEDDING.date}T12:00:00Z`)}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed font-light text-muted-foreground">
              <MapPin className="mr-1 mb-0.5 inline size-4" /> {VENUE.name}, {VENUE.address.slice(1, -1).join(", ")}, <span className="whitespace-nowrap">{VENUE.address[VENUE.address.length - 1]}</span>
            </p>
            <div className="mx-auto mt-10 max-w-md border-t pt-9">
              <Countdown target={`${WEDDING.date}T00:00:00Z`} />
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/rsvp" className={pill}>
                RSVP
              </Link>
              <Link href="/schedule" className={pillOutline}>
                See the schedule
              </Link>
            </div>
          </div>
        </OverlapCard>
      </section>
    </>
  );
}
