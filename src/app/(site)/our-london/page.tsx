import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import type { LucideIcon } from "lucide-react";
import { Beef, Drama, Footprints, Heart, Landmark, Laugh, Music, Sparkles, Ticket, Utensils, Wine } from "lucide-react";
import { Container, PageShell, SectionTitle } from "@/components/site/page-shell";
import { LinkedText } from "@/components/site/linked-text";
import { PhotoBand } from "@/components/site/photo-band";
import { Reveal } from "@/components/site/reveal";
import { LONDON } from "@/lib/site-content";

export const metadata = { title: "Our London" };

const serif = { fontFamily: "var(--font-cormorant), Georgia, serif" } as const;

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
    <h3 className="text-3xl font-light tracking-[0.08em] uppercase" style={serif}>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block py-2 underline decoration-foreground/25 underline-offset-[7px] transition-colors hover:decoration-foreground">
          {name}
        </a>
      ) : (
        name
      )}
    </h3>
  );
}

// One place or thing: an icon, a title and a few words, with a hairline above. No box.
function Entry({ icon: Icon, name, url, text, tag }: { icon: LucideIcon; name: string; url?: string; text?: string; tag?: string }) {
  return (
    <div className="h-full border-t border-foreground/15 pt-8 text-center">
      <Icon className="mx-auto size-7 text-muted-foreground" strokeWidth={1} />
      {tag && <p className="mt-4 text-[11px] font-light tracking-[0.3em] text-muted-foreground uppercase">{tag}</p>}
      <div className="mt-4">
        <Title name={name} url={url} />
      </div>
      {text && (
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-[1.85] font-light text-muted-foreground">
          <LinkedText text={text} />
        </p>
      )}
    </div>
  );
}

export const revalidate = 120;

export default async function OurLondonPage() {
  const rows = await getSitePhotos();
  return (
    <PageShell
      title="Our London"
      intro={LONDON.intro}
      hero={resolvePhoto("hero-our-london", rows)}
    >
      <Container wide className="py-16 sm:py-24">
        <SectionTitle eyebrow="Eat & drink">{LONDON.favouriteBars.heading}</SectionTitle>
        <ul className="mx-auto mt-14 grid max-w-3xl gap-x-16 gap-y-14 sm:grid-cols-2">
          {LONDON.favouriteBars.items.map((it, i) => (
            <li key={it.name}>
              <Reveal className="h-full" delay={i % 2 ? 1 : undefined}>
                <Entry icon={it.name === "Swift" ? Heart : i % 2 ? Wine : Beef} name={it.name} url={"url" in it ? it.url : undefined} text={it.text} tag={it.name === "Swift" ? "Our first date" : it.name === "Hawksmoor" ? "Our second date" : undefined} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>

      <PhotoBand photo={resolvePhoto("london-band", rows)} />

      <Container wide className="py-16 sm:py-24">
        <SectionTitle eyebrow="While you’re in town">{LONDON.thingsWeLove.heading}</SectionTitle>
        <ul className="mt-14 grid gap-x-14 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {LONDON.thingsWeLove.items.map((it, i) => (
            <li key={it.name} className="sm:[&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1 lg:[&:last-child:nth-child(3n+1)]:col-start-2">
              <Reveal className="h-full" delay={(i % 3 === 0 ? undefined : i % 3 === 1 ? 1 : 2) as 1 | 2 | undefined}>
                <Entry icon={THINGS[it.name] ?? Sparkles} name={it.name} text={it.text} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </PageShell>
  );
}
