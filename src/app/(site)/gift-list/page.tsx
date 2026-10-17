import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import Image from "next/image";
import { Container, PageShell, pill } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { GIFTS } from "@/lib/site-content";

export const metadata = { title: "Gift List" };
export const dynamic = "force-dynamic";

export default async function GiftListPage() {
  const rows = await getSitePhotos();
  const honeymoon = resolvePhoto("gift-honeymoon", rows);
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
              <div className="mt-7">
                <a href={GIFTS.monzoUrl} target="_blank" rel="noopener noreferrer" className={`${pill} !h-auto flex-col gap-0.5 px-5 py-3`}>
                  <span>Contribute to our honeymoon</span>
                  <span className="text-[11px] font-light opacity-80">Pay by bank or card (Monzo)</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>

    </PageShell>
  );
}
