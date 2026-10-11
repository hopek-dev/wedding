import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Countdown } from "@/components/site/countdown";
import { HeroSlideshow, type Slide } from "@/components/site/hero-slideshow";
import { OverlapCard } from "@/components/site/overlap-card";
import { pill, pillOutline } from "@/components/site/page-shell";
import { eventDay } from "@/lib/public-site";
import { VENUE, WEDDING } from "@/lib/site-content";

export const metadata = { title: "Welcome" };

// The rolling hero photos come from the Photos page in the planner (slots welcome-1 to welcome-7).
const SLIDE_SLOTS = ["welcome-1", "welcome-2", "welcome-3", "welcome-4", "welcome-5", "welcome-6", "welcome-7"];

export const revalidate = 120;

export default async function WelcomePage() {
  const rows = await getSitePhotos();
  const SLIDES: Slide[] = SLIDE_SLOTS.map((id) => {
    const p = resolvePhoto(id, rows);
    return { src: p.src, alt: p.alt, focus: p.focus };
  });
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
