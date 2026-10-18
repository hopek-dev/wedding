import Link from "next/link";
import { ArrowRight } from "lucide-react";

// The rest of the wedding website, offered to a guest once they have replied (and to anyone who comes back to
// their invitation later), so it is obvious there is more to see than the RSVP.
const PAGES = [
  { href: "/schedule", name: "Schedule", hint: "The plan for the day, from the ceremony to the dancing" },
  { href: "/travel", name: "Travel", hint: "How to get to Mulberry House" },
  { href: "/places-to-stay", name: "Places to Stay", hint: "Hotels near the venue, on a map" },
  { href: "/our-london", name: "Our London", hint: "Our favourite places in the city" },
  { href: "/qa", name: "Q & A", hint: "Dress code, parking, weather and more" },
  { href: "/our-story", name: "Our Story", hint: "How it all began" },
  { href: "/gift-list", name: "Gift List", hint: "Contribute to our honeymoon, if you'd like to" },
] as const;

export function ExploreSite({ className = "" }: { className?: string }) {
  return (
    <section className={`text-left ${className}`} aria-labelledby="explore-site">
      <h3 id="explore-site" className="text-center text-xl font-light tracking-[0.08em] uppercase" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
        While you&rsquo;re here
      </h3>
      <p className="mt-1 text-center text-sm text-muted-foreground">Everything you need to know about the day is on our wedding website.</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {PAGES.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="group flex h-full items-center justify-between gap-3 rounded-md border bg-background/60 px-4 py-3 transition-colors hover:bg-secondary">
              <span>
                <span className="block text-[15px] font-medium">{p.name}</span>
                <span className="block text-[13px] font-light text-muted-foreground">{p.hint}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
