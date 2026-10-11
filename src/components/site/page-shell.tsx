import Image from "next/image";
import type { ReactNode } from "react";
import { OverlapCard } from "@/components/site/overlap-card";
import { ParallaxImage } from "@/components/site/parallax-image";
import { Reveal } from "@/components/site/reveal";

export interface PageHero {
  src: string;
  alt: string;
  pos?: string; // object-position class
  // An upright photo. On a wide screen it is shown whole, at full height and not enlarged, with a soft blurred
  // copy of itself filling the sides (enlarging it to the screen's width would make it soft and pixelated).
  portrait?: boolean;
  ratio?: number; // width / height of an upright photo (default 9:16)
}

// Every wedding page has the same shape, like the welcome page:
//  1. a full-screen photograph with no text on it (the header floats over it),
//  2. a title card that rises over the bottom of the photo as you scroll,
//  3. the page's content, laid out openly on the cream page (pages place their own width with <Container>).
export function PageShell({ title, intro, children, hero }: { title: string; intro?: ReactNode; children?: ReactNode; hero: PageHero }) {
  return (
    <>
      <section className="relative isolate h-[100svh] min-h-[520px] overflow-hidden bg-secondary portrait:h-[66svh] portrait:min-h-[440px]" aria-label={hero.alt}>
        {hero.portrait ? (
          <>
            <div className="absolute inset-0 landscape:hidden">
              <ParallaxImage src={hero.src} alt={hero.alt} pos={hero.pos} priority settle strength={0.04} bleed={4} />
            </div>
            <div className="absolute inset-0 hidden landscape:block">
              <Image src={hero.src} alt="" aria-hidden fill sizes="30vw" className="scale-125 object-cover opacity-90 blur-3xl" />
              {/* the photo's own box, as wide as the photo is at full height, with soft edges so it melts into the blur */}
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)]"
                style={{ width: `min(100%, calc(100svh * ${hero.ratio ?? 9 / 16}))` }}
              >
                <Image src={hero.src} alt={hero.alt} fill priority quality={90} sizes="70vw" className="hero-settle object-cover" />
              </div>
            </div>
          </>
        ) : (
          <ParallaxImage src={hero.src} alt={hero.alt} pos={hero.pos} priority settle strength={0.04} bleed={4} />
        )}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/25 to-transparent" />
        {/* a thin line that draws itself down, hinting that the page continues */}
        <div aria-hidden className="scroll-cue absolute bottom-7 left-1/2 h-14 w-px -translate-x-1/2 bg-white/25" />
      </section>

      <div className="relative z-10 mx-auto max-w-3xl px-4">
        <OverlapCard>
          <div className="bg-background px-6 py-12 text-center shadow-[0_20px_60px_-24px_rgba(70,62,30,0.35)] ring-1 ring-foreground/10 sm:px-14 sm:py-16">
            <h1 className="text-[2rem] font-light tracking-[0.14em] text-foreground uppercase sm:text-5xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
              {title}
            </h1>
            <div className="ornament mt-6" aria-hidden>
              <i />
            </div>
            {intro && <div className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed font-light text-muted-foreground sm:text-lg">{intro}</div>}
          </div>
        </OverlapCard>
      </div>

      <div className="pt-4">{children}</div>
      <div className="h-10 sm:h-16" />
    </>
  );
}

// The reading width for a page's content.
export function Container({ children, wide = false, className = "" }: { children: ReactNode; wide?: boolean; className?: string }) {
  return <div className={`mx-auto w-full px-5 ${wide ? "max-w-5xl" : "max-w-3xl"} ${className}`}>{children}</div>;
}

// A heading for a section of a page: a small label, then a large title with the diamond rule.
export function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <Reveal>
      <div className="text-center">
        {eyebrow && <p className="text-[12px] font-light tracking-[0.38em] text-muted-foreground uppercase">{eyebrow}</p>}
        <h2 className="mt-3 text-3xl font-light tracking-[0.1em] uppercase sm:text-5xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
          {children}
        </h2>
        <div className="ornament mt-5" aria-hidden>
          <i />
        </div>
      </div>
    </Reveal>
  );
}

export const pill =
  "inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium tracking-wide text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90";
export const pillOutline =
  "inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium tracking-wide text-foreground ring-1 ring-foreground/25 transition-all hover:-translate-y-0.5 hover:bg-secondary";
