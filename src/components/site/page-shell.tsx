import type { ReactNode } from "react";
import Image from "next/image";
import { OverlapCard } from "@/components/site/overlap-card";
import { Reveal } from "@/components/site/reveal";

// Shared page frame: a heading with an ornament, then a calm reading column.
export interface PageHero {
  src: string;
  alt: string;
  pos?: string; // object-position class
}

export function PageShell({ title, intro, children, wide = false, hero }: { title: string; intro?: ReactNode; children?: ReactNode; wide?: boolean; hero?: PageHero }) {
  if (hero) {
    // A still photo banner with no text on it. The title sits in a card that overlaps the bottom of the
    // photo and fades in as you scroll, like the welcome page.
    return (
      <>
        <section className="relative isolate h-[40vh] min-h-[250px] overflow-hidden md:h-[62vh] md:max-h-[640px]" aria-label={hero.alt}>
          <Image src={hero.src} alt={hero.alt} fill priority sizes="100vw" className={`-z-20 object-cover ${hero.pos ?? "object-center"}`} />
          <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-black/25 to-transparent" />
        </section>
        <div className={`relative z-10 mx-auto px-4 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
          <OverlapCard>
            <div className="bg-background px-4 py-10 shadow-[0_20px_60px_-24px_rgba(70,62,30,0.35)] ring-1 ring-foreground/10 sm:px-10 sm:py-14">
              <h1
                className="text-center text-3xl font-light tracking-[0.12em] text-foreground uppercase sm:text-5xl sm:tracking-[0.14em]"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                {title}
              </h1>
              <div className="ornament mt-5" aria-hidden>
                <i />
              </div>
              {intro && <div className="mx-auto mt-6 max-w-xl text-center text-[15px] leading-relaxed font-light text-muted-foreground sm:text-lg">{intro}</div>}
              <div className="mt-9 sm:mt-12">{children}</div>
            </div>
          </OverlapCard>
        </div>
        <div className="h-12 sm:h-20" />
      </>
    );
  }
  return (
    <div className={`mx-auto w-full px-5 py-10 sm:py-20 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
      <Reveal>
        <h1
          className="text-center text-[1.65rem] font-light tracking-[0.12em] text-foreground uppercase sm:text-5xl sm:tracking-[0.14em]"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          {title}
        </h1>
        <div className="ornament mt-5" aria-hidden>
          <i />
        </div>
        {intro && <div className="mx-auto mt-6 max-w-xl text-center text-[15px] leading-relaxed font-light text-muted-foreground sm:text-base">{intro}</div>}
      </Reveal>
      <div className="mt-9 sm:mt-12">{children}</div>
    </div>
  );
}

export const pill =
  "inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium tracking-wide text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90";
export const pillOutline =
  "inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium tracking-wide text-foreground ring-1 ring-foreground/25 transition-all hover:-translate-y-0.5 hover:bg-secondary";
