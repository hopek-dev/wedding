import type { LucideIcon } from "lucide-react";
import { Beef, Drama, Footprints, Heart, Landmark, Laugh, Music, Sparkles, Ticket, Utensils, Wine } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { LinkedText } from "@/components/site/linked-text";
import { Reveal } from "@/components/site/reveal";
import { LONDON } from "@/lib/site-content";

export const metadata = { title: "Our London" };

const serif = { fontFamily: "var(--font-cormorant), Georgia, serif" } as const;
const tile =
  "group relative h-full bg-card px-6 py-8 shadow-[0_18px_44px_-30px_rgba(70,62,30,0.45)] ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_54px_-28px_rgba(70,62,30,0.55)] sm:px-8";
const chip = "mb-5 grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground ring-1 ring-foreground/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground";

const THINGS: Record<string, LucideIcon> = {
  "Visit the theatre": Drama,
  Comedy: Laugh,
  "Food!": Utensils,
  Walks: Footprints,
  Museums: Landmark,
  Experiences: Ticket,
  Music: Music,
};

function Title({ name, url }: { name: string; url?: string }) {
  return (
    <h3 className="text-2xl font-light tracking-[0.08em] uppercase" style={serif}>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-foreground/25 underline-offset-[6px] transition-colors hover:decoration-foreground">
          {name}
        </a>
      ) : (
        name
      )}
    </h3>
  );
}

function SectionHead({ children, eyebrow }: { children: string; eyebrow: string }) {
  return (
    <div className="mb-9 text-center">
      <p className="text-[12px] font-light tracking-[0.35em] text-muted-foreground uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-light tracking-[0.1em] uppercase sm:text-4xl" style={serif}>
        {children}
      </h2>
      <div className="ornament mt-4" aria-hidden>
        <i />
      </div>
    </div>
  );
}

export default function OurLondonPage() {
  return (
    <PageShell
      title="Our London"
      intro={LONDON.intro}
      wide
      hero={{ src: "/site/ring.webp", alt: "Their hands together, with an engagement ring", pos: "object-[50%_45%]" }}
    >
      <div className="grid gap-20">
        <section>
          <Reveal>
            <SectionHead eyebrow="Eat & drink">{LONDON.favouriteBars.heading}</SectionHead>
          </Reveal>
          <ul className="grid gap-6 sm:grid-cols-2">
            {LONDON.favouriteBars.items.map((it, i) => {
              const first = it.name === "Swift";
              const Icon = first ? Heart : i % 2 ? Wine : Beef;
              return (
                <li key={it.name}>
                  <Reveal className="h-full" delay={i % 2 ? 1 : undefined}>
                    <div className={tile}>
                      {first && (
                        <span className="absolute top-5 right-5 rounded-full bg-secondary px-3 py-1 text-[11px] font-light tracking-[0.2em] text-muted-foreground uppercase">Our first date</span>
                      )}
                      <span className={chip}>
                        <Icon className="size-5" strokeWidth={1.4} />
                      </span>
                      <Title name={it.name} url={"url" in it ? it.url : undefined} />
                      {it.text && (
                        <p className="mt-3 text-[15px] leading-[1.8] font-light text-muted-foreground">
                          <LinkedText text={it.text} />
                        </p>
                      )}
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <Reveal>
            <SectionHead eyebrow="While you’re in town">{LONDON.thingsWeLove.heading}</SectionHead>
          </Reveal>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {LONDON.thingsWeLove.items.map((it, i) => {
              const Icon = THINGS[it.name] ?? Sparkles;
              return (
                <li key={it.name} className="sm:[&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1 lg:[&:last-child:nth-child(3n+1)]:col-start-2">
                  <Reveal className="h-full" delay={(i % 3 === 0 ? undefined : i % 3 === 1 ? 1 : 2) as 1 | 2 | undefined}>
                    <div className={tile}>
                      <span className={chip}>
                        <Icon className="size-5" strokeWidth={1.4} />
                      </span>
                      <Title name={it.name} />
                      {it.text && (
                        <p className="mt-3 text-[15px] leading-[1.8] font-light text-muted-foreground">
                          <LinkedText text={it.text} />
                        </p>
                      )}
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
