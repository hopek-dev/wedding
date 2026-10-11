import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import Image from "next/image";
import { getPublicRegistry } from "@/app/actions/registry";
import { GiftCard } from "@/components/site/gift-card";
import { Container, PageShell, SectionTitle, pill } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { GIFTS } from "@/lib/site-content";

export const metadata = { title: "Gift List" };
export const dynamic = "force-dynamic";

export default async function GiftListPage() {
  const rows = await getSitePhotos();
  const honeymoon = resolvePhoto("gift-honeymoon", rows);
  const { items } = await getPublicRegistry();
  return (
    <PageShell title="Gift List" hero={resolvePhoto("hero-gift-list", rows)}>
      {/* the honeymoon: a thumbnail photo to the left of the message and the button */}
      <Container wide className="py-14 sm:py-20">
        <Reveal>
          <div className="mx-auto grid max-w-4xl items-center gap-8 sm:grid-cols-[minmax(0,20rem)_1fr] sm:gap-12">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden bg-secondary shadow-[0_20px_50px_-28px_rgba(70,62,30,0.5)] ring-1 ring-foreground/10 sm:max-w-none">
              <Image src={honeymoon.src} alt={honeymoon.alt} fill sizes="(min-width: 640px) 320px, 90vw" className="object-cover" style={{ objectPosition: `${honeymoon.focus.x}% ${honeymoon.focus.y}%` }} />
            </div>
            <div className="text-center">
              <p className="mx-auto max-w-md leading-relaxed font-light" style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "clamp(1.2rem, 2.1vw, 1.55rem)" }}>
                {GIFTS.message}
              </p>
              <a href={GIFTS.fundUrl} target="_blank" rel="noopener noreferrer" className={`${pill} mt-7`}>
                Contribute to our honeymoon
              </a>
            </div>
          </div>
        </Reveal>
      </Container>

      {items.length > 0 && (
        <Container wide className="pb-10">
          <SectionTitle eyebrow="Or choose something from our list">Our list</SectionTitle>
          <Reveal>
            <p className="mx-auto mt-6 mb-12 max-w-md text-center text-[15px] leading-relaxed font-light text-muted-foreground">
              Buy a gift from the shop, then tap &ldquo;I&rsquo;ve bought this&rdquo; so no one doubles up.
            </p>
          </Reveal>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <li key={it.id}>
                <GiftCard item={it} />
              </li>
            ))}
          </ul>
        </Container>
      )}
    </PageShell>
  );
}
