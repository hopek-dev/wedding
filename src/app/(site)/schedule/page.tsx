import Link from "next/link";
import { BedDouble, CalendarPlus, Camera, Heart, MapPin, Music, Navigation, UtensilsCrossed } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { SCHEDULE, directionsLink, timeRange } from "@/lib/schedule";
import { eventDay } from "@/lib/public-site";
import { WEDDING } from "@/lib/site-content";

export const metadata = { title: "Schedule" };

function iconFor(name: string) {
  const n = name.toLowerCase();
  if (/ceremony|wedding$|vows/.test(n)) return Heart;
  if (/photo/.test(n)) return Camera;
  if (/reception|dinner|meal|breakfast|lunch|brunch/.test(n)) return UtensilsCrossed;
  if (/dance|party|evening|disco/.test(n)) return Music;
  return Heart;
}

const action =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-medium tracking-wide text-foreground ring-1 ring-foreground/20 transition-colors hover:bg-secondary active:bg-secondary";

export default function SchedulePage() {
  return (
    <PageShell
      title="Schedule"
      intro={eventDay(`${WEDDING.date}T12:00:00Z`)}
      hero={{ src: "/site/blossom.webp", alt: "Vanessa and Hope among the blossom", pos: "object-[50%_28%]" }}
    >
      <ol className="relative grid gap-7">
        {/* a thin line running down the middle ties the events together */}
        <span aria-hidden className="absolute top-8 bottom-8 left-1/2 w-px -translate-x-1/2 bg-border" />
        {SCHEDULE.map((e, i) => {
          const Icon = iconFor(e.name);
          return (
            <li key={e.id} className="relative">
              <Reveal delay={i === 0 ? undefined : 1}>
                <div className="bg-card px-5 py-9 text-center shadow-[0_18px_44px_-30px_rgba(70,62,30,0.45)] ring-1 ring-foreground/10 sm:px-8">
                  <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground ring-1 ring-foreground/10">
                    <Icon className="size-5" strokeWidth={1.4} />
                  </span>
                  <p className="text-[15px] font-light tracking-[0.18em] text-muted-foreground uppercase">{timeRange(e)}</p>
                  <h2 className="mt-2 text-2xl font-light tracking-[0.1em] uppercase sm:text-3xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                    {e.name}
                  </h2>
                  {e.note && (
                    <p className="mt-2 text-lg font-light italic text-muted-foreground" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                      {e.note}
                    </p>
                  )}
                  <p className="mx-auto mt-3 inline-flex max-w-md items-start justify-center gap-1.5 text-[15px] leading-relaxed font-light text-muted-foreground">
                    <MapPin className="mt-1 size-4 shrink-0" strokeWidth={1.5} />
                    <span>{e.venue}</span>
                  </p>
                  {e.dressCode && (
                    <p className="mx-auto mt-4 w-fit rounded-full bg-secondary px-4 py-1.5 text-[13px] font-light tracking-wide text-muted-foreground">Dress code · {e.dressCode}</p>
                  )}
                  <div className="mt-7 flex flex-wrap justify-center gap-2.5">
                    <a href={`/calendar/${e.id}.ics`} download className={action}>
                      <CalendarPlus className="size-4" strokeWidth={1.6} /> Add to Calendar
                    </a>
                    <Link href="/places-to-stay" className={action}>
                      <BedDouble className="size-4" strokeWidth={1.6} /> Where to Stay
                    </Link>
                    <a href={directionsLink} target="_blank" rel="noopener noreferrer" className={action}>
                      <Navigation className="size-4" strokeWidth={1.6} /> Directions
                    </a>
                  </div>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
      <Reveal className="mt-10">
        <div className="text-center">
          <a href="/calendar/all.ics" download className={action}>
            <CalendarPlus className="size-4" strokeWidth={1.6} /> Add the whole day to your calendar
          </a>
        </div>
      </Reveal>
    </PageShell>
  );
}
