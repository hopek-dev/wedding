import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import { Container, PageShell, SectionTitle } from "@/components/site/page-shell";
import { PhotoBand } from "@/components/site/photo-band";
import { Reveal } from "@/components/site/reveal";
import { STORY, STORY_QA } from "@/lib/site-content";

export const metadata = { title: "Our Story" };

const serif = { fontFamily: "var(--font-cormorant), Georgia, serif" } as const;

// The story is told in big, quiet type with a photograph between its chapters.
function Paragraph({ text }: { text: string }) {
  return (
    <Reveal>
      <p className="py-8 text-center text-[1.4rem] leading-[1.85] font-light sm:py-10 sm:text-[1.75rem]" style={serif}>
        {text}
      </p>
    </Reveal>
  );
}

export const revalidate = 120;

export default async function OurStoryPage() {
  const rows = await getSitePhotos();
  return (
    <PageShell title="Our Story" hero={resolvePhoto("hero-our-story", rows)}>
      <Container className="pt-14 sm:pt-20">
        {STORY.slice(0, 2).map((p) => (
          <Paragraph key={p.slice(0, 24)} text={p} />
        ))}
      </Container>

      <div className="my-14 sm:my-24">
        <PhotoBand photo={resolvePhoto("story-band-1", rows)} />
      </div>

      <Container>
        {STORY.slice(2).map((p) => (
          <Paragraph key={p.slice(0, 24)} text={p} />
        ))}
      </Container>

      <div className="my-14 sm:my-24">
        <PhotoBand photo={resolvePhoto("story-band-2", rows)} />
      </div>

      <Container wide className="py-6 sm:py-12">
        <SectionTitle eyebrow="Just for fun">A few questions for us</SectionTitle>
        <dl className="mx-auto mt-14 grid max-w-4xl gap-x-16 gap-y-12 sm:grid-cols-2">
          {STORY_QA.map((item, i) => (
            <Reveal key={item.q} delay={i % 2 === 0 ? undefined : 1}>
              <div className="border-t border-foreground/15 pt-6 text-center">
                <dt className="text-2xl font-light tracking-wide" style={serif}>
                  {item.q}
                </dt>
                <dd className="mt-3 text-[15px] leading-relaxed font-light text-muted-foreground">{item.a}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Container>
    </PageShell>
  );
}
