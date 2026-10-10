import Image from "next/image";
import { Gift } from "lucide-react";
import { getPublicRegistry } from "@/app/actions/registry";
import { GiftCard } from "@/components/site/gift-card";
import { PageShell, pill } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { GIFTS } from "@/lib/site-content";

export const metadata = { title: "Gift List" };
export const dynamic = "force-dynamic";

export default async function GiftListPage() {
  const { items } = await getPublicRegistry();
  return (
    <PageShell title="Gift List" wide>
      <Reveal>
        <div className="grid overflow-hidden bg-card shadow-[0_24px_60px_-34px_rgba(70,62,30,0.55)] ring-1 ring-foreground/10 md:grid-cols-2">
          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[22rem]">
            <Image src="/site/ring.webp" alt="Their hands together, with an engagement ring" fill sizes="(min-width: 768px) 480px, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground ring-1 ring-foreground/10">
              <Gift className="size-5" strokeWidth={1.4} />
            </span>
            <p className="text-lg leading-relaxed font-light" style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.45rem" }}>
              {GIFTS.message}
            </p>
            <a href={GIFTS.fundUrl} target="_blank" rel="noopener noreferrer" className={`${pill} mt-8`}>
              Contribute to our honeymoon
            </a>
          </div>
        </div>
      </Reveal>

      {items.length > 0 && (
        <section className="mt-16">
          <Reveal>
            <h2 className="text-center text-2xl font-light tracking-[0.12em] uppercase sm:text-3xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
              Or choose something from our list
            </h2>
            <p className="mx-auto mt-3 max-w-md text-center text-[15px] leading-relaxed font-light text-muted-foreground">
              Tap &ldquo;I&rsquo;ll get this&rdquo; to reserve a gift so no one doubles up, then buy it from the shop.
            </p>
            <div className="ornament mt-5 mb-10" aria-hidden>
              <i />
            </div>
          </Reveal>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <li key={it.id}>
                <GiftCard item={it} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}
