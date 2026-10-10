import Link from "next/link";
import { ExternalLink, MapPin, Star } from "lucide-react";
import { PageShell, pill, pillOutline } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { StayMap } from "@/components/site/stay-map";
import { STAY, STAY_PLACES, VENUE } from "@/lib/site-content";

export const metadata = { title: "Places to Stay" };

const serif = { fontFamily: "var(--font-cormorant), Georgia, serif" } as const;

export default function StayPage() {
  return (
    <PageShell
      title="Places to Stay"
      intro={STAY.intro}
      wide
      hero={{ src: "/site/venue.webp", alt: `${VENUE.name} across the lake`, pos: "object-[50%_55%]" }}
    >
      <Reveal>
        <div className="overflow-hidden shadow-[0_24px_60px_-34px_rgba(70,62,30,0.55)] ring-1 ring-foreground/10">
          <StayMap places={STAY_PLACES} />
        </div>
        <p className="mt-3 text-center text-[13px] font-light text-muted-foreground">Numbers on the map match the list below. The gold pin is the venue.</p>
      </Reveal>

      <ol className="mt-12 grid gap-6">
        {STAY_PLACES.map((p, i) => (
          <li key={p.id} id={`stay-${p.id}`} className="scroll-mt-28">
            <Reveal>
              <article className="grid gap-4 bg-card px-6 py-7 shadow-[0_18px_44px_-30px_rgba(70,62,30,0.45)] ring-1 ring-foreground/10 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8 sm:px-9">
                <div>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 grid size-8 shrink-0 place-items-center rounded-full text-sm font-medium text-white ${p.onSite ? "bg-[#9a7b2f]" : "bg-[#3a3a3a]"}`}>{i + 1}</span>
                    <div>
                      <h2 className="text-2xl font-light tracking-[0.08em] uppercase" style={serif}>
                        {p.name}
                      </h2>
                      <p className="mt-0.5 text-[13px] font-light tracking-wide text-muted-foreground">{p.kind}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[15px] leading-[1.75] font-light text-muted-foreground">{p.blurb}</p>
                  <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] font-light">
                    {p.rating != null && (
                      <span className="inline-flex items-center gap-1.5">
                        <Star className="size-4 fill-[#9a7b2f] text-[#9a7b2f]" strokeWidth={1.5} />
                        <strong className="font-medium">
                          {p.rating}/{p.ratingOutOf}
                        </strong>
                        <span className="text-muted-foreground">
                          {p.ratingSource}
                          {p.reviews ? ` · ${p.reviews.toLocaleString("en-GB")} reviews` : ""}
                        </span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-4" strokeWidth={1.5} />
                      {p.miles != null ? `${p.miles} miles from the venue` : "At the venue"}
                    </span>
                  </p>
                </div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className={`${p.onSite ? pill : pillOutline} gap-2 whitespace-nowrap sm:w-64`}>
                  {p.bookLabel} <ExternalLink className="size-4" strokeWidth={1.6} />
                </a>
              </article>
            </Reveal>
          </li>
        ))}
      </ol>

      <Reveal className="mt-12">
        <div className="mx-auto max-w-xl bg-secondary/60 px-6 py-8 text-center ring-1 ring-foreground/10">
          <p className="text-xl font-light tracking-wide" style={serif}>
            Tell us where you&rsquo;ll be staying
          </p>
          <p className="mt-2 text-[15px] leading-relaxed font-light text-muted-foreground">
            There&rsquo;s a quick question on your RSVP, so we know who is nearby. Ratings were taken from the sites named and may have changed, so check before you book.
          </p>
          <Link href="/rsvp" className={`${pill} mt-6`}>
            RSVP
          </Link>
        </div>
      </Reveal>
    </PageShell>
  );
}
