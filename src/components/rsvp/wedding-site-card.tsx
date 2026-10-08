import { ExternalLink } from "lucide-react";
import { WEDDING_SITE_URL } from "@/lib/site";

// Points guests to the main wedding website, where the schedule, travel, places
// to stay, Q&A and the gift list are. Shown on every guest page.
export function WeddingSiteCard({ className = "" }: { className?: string }) {
  return (
    <section className={`rounded-md border bg-card p-6 text-center ${className}`}>
      <h3 className="text-lg font-medium tracking-wide">Everything else is on our wedding website</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        The schedule, travel, places to stay, your questions answered, and our gift list.
      </p>
      <a
        href={WEDDING_SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
      >
        Visit our wedding website <ExternalLink className="size-4" />
      </a>
    </section>
  );
}
