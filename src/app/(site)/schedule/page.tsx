import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import Image from "next/image";
import Link from "next/link";
import { BedDouble, CalendarPlus, Camera, Heart, MapPin, Music, Navigation, UtensilsCrossed } from "lucide-react";
import { Container, PageShell } from "@/components/site/page-shell";
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

const serif = { fontFamily: "var(--font-cormorant), Georgia, serif" } as const;
const action =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-medium tracking-wide text-foreground ring-1 ring-foreground/20 transition-colors hover:bg-secondary active:bg-secondary";

// The two photographs at the bottom of the page, side by side (slots schedule-photo-1 and schedule-photo-2).
const PHOTO_SLOTS = ["schedule-photo-1", "schedule-photo-2"];

export const revalidate = 120;

export default async function SchedulePage() {
  const rows = await getSitePhotos();
  const last = SCHEDULE.length - 1;
  const photos = PHOTO_SLOTS.map((id) => resolvePhoto(id, rows));
  return (
    <PageShell
      title="Schedule"
      intro={eventDay(`${WEDDING.date}T12:00:00Z`)}
      hero={resolvePhoto("hero-schedule", rows)}
    >
      <Container wide className="py-16 sm:py-24">
        {/* The day as a timeline: a line runs from each event to the next, drawing itself as you scroll down.
            On a phone the line runs down the left; from tablet up it runs down the middle and the events
            alternate either side of it. */}
        <ol className="mx-auto max-w-5xl">
          {SCHEDULE.map((e, i) => {
            const Icon = iconFor(e.name);
            const left = i % 2 === 0; // which side the text sits on, from tablet up
            return (
              <li key={e.id}>
                <Reveal threshold={0.05} className="tl-row relative">
                  <div className={`grid grid-cols-[3rem_1fr] gap-x-5 md:grid-cols-[1fr_3rem_1fr] md:gap-x-10 ${i < last ? "pb-16 md:pb-24" : ""}`}>
                    {/* the node on the line */}
                    <div className="relative z-10 col-start-1 row-start-1 flex justify-center md:col-start-2">
                      <span className="tl-node grid size-12 place-items-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/25">
                        <Icon className="size-5" strokeWidth={1.2} />
                      </span>
                    </div>

                    {/* the event */}
                    <div className={`col-start-2 row-start-1 pt-1 text-left ${left ? "md:col-start-1 md:text-right" : "md:col-start-3 md:text-left"}`}>
                      <p className="text-[13px] font-light tracking-[0.3em] text-muted-foreground uppercase">{timeRange(e)}</p>
                      <h2 className="mt-2 text-3xl leading-tight font-light tracking-[0.08em] uppercase sm:text-5xl" style={serif}>
                        {e.name}
                      </h2>
                      {e.note && (
                        <p className="mt-2 text-xl font-light italic text-muted-foreground sm:text-2xl" style={serif}>
                          {e.note}
                        </p>
                      )}
                      <p className={`mt-4 inline-flex max-w-md items-start gap-1.5 text-[15px] leading-relaxed font-light text-muted-foreground ${left ? "md:flex-row-reverse" : ""}`}>
                        <MapPin className="mt-1 size-4 shrink-0" strokeWidth={1.5} />
                        <span>{e.venue}</span>
                      </p>
                      <div className={`mt-6 flex flex-wrap gap-2.5 ${left ? "md:justify-end" : ""}`}>
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
                  </div>

                  {/* the line from this event's node down to the next one's */}
                  {i < last && <span aria-hidden className="tl-line absolute top-6 -bottom-6 left-6 w-px bg-foreground/30 md:left-1/2" />}
                </Reveal>
              </li>
            );
          })}
        </ol>

        <Reveal>
          <div className="pt-20 text-center sm:pt-28">
            <a href="/calendar/all.ics" download className={action}>
              <CalendarPlus className="size-4" strokeWidth={1.6} /> Add the whole day to your calendar
            </a>
          </div>
        </Reveal>
      </Container>

      {/* two photographs, side by side, to finish */}
      <Reveal threshold={0}>
        <div className="grid grid-cols-2 gap-[3px] bg-background">
          {photos.map((p) => (
            <div key={p.slot} className="relative aspect-square overflow-hidden bg-secondary sm:aspect-[4/3]">
              <Image src={p.src} alt={p.alt} fill quality={90} sizes="50vw" className="object-cover" style={{ objectPosition: `${p.focus.x}% ${p.focus.y}%` }} />
            </div>
          ))}
        </div>
      </Reveal>
    </PageShell>
  );
}
