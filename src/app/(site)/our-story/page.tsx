import Image from "next/image";
import { PageShell } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { STORY, STORY_QA } from "@/lib/site-content";

export const metadata = { title: "Our Story" };

export default function OurStoryPage() {
  return (
    <PageShell title="Our Story" wide>
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden shadow-[0_20px_50px_-28px_rgba(70,62,30,0.5)] ring-1 ring-foreground/10">
            <Image src="/site/blossom.webp" alt="Vanessa and Hope among the blossom" fill sizes="(min-width: 768px) 480px, 100vw" className="object-cover object-[50%_25%]" priority />
          </div>
        </Reveal>
        <div className="grid gap-6 text-base leading-[1.95] font-light sm:text-[17px]">
          {STORY.map((p, i) => (
            <Reveal key={p.slice(0, 24)} delay={i === 0 ? undefined : 1}>
              <p className={i === 0 ? "drop-cap" : undefined}>{p}</p>
            </Reveal>
          ))}
        </div>
      </div>
      <Reveal className="mt-16 sm:mt-20">
        <div className="ornament mb-2" aria-hidden>
          <i />
        </div>
        <h2 className="text-center text-2xl font-light tracking-[0.14em] uppercase sm:text-3xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
          A few questions for us
        </h2>
      </Reveal>
      <dl className="mx-auto mt-10 grid max-w-3xl gap-px bg-border sm:grid-cols-2">
        {STORY_QA.map((item, i) => (
          <Reveal key={item.q} delay={i % 2 === 0 ? undefined : 1} className="bg-background">
            <div className="h-full px-6 py-8 text-center">
              <dt className="text-xl font-light tracking-wide sm:text-[1.35rem]" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                {item.q}
              </dt>
              <dd className="mt-3 text-[15px] leading-relaxed font-light text-muted-foreground">{item.a}</dd>
            </div>
          </Reveal>
        ))}
      </dl>
      <Reveal className="mt-16">
        <div className="grid grid-cols-2 gap-[3px] bg-white md:grid-cols-3">
          {[
            { src: "/site/seaside.webp", alt: "Vanessa and Hope by the sea" },
            { src: "/site/lisbon.webp", alt: "Vanessa and Hope in Lisbon" },
            { src: "/site/ring.webp", alt: "Their hands together, with an engagement ring" },
          ].map((p, i) => (
            <div key={p.src} className={`relative aspect-[4/3] overflow-hidden ${i === 2 ? "hidden md:block" : ""}`}>
              <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
        <p className="font-cursive mt-8 text-center text-4xl text-muted-foreground sm:text-5xl">Vanessa &amp; Hope</p>
      </Reveal>
    </PageShell>
  );
}
