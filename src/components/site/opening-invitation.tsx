import { Loader2 } from "lucide-react";

// "Opening your invitation": shown while a guest's personal page is on its way. That page is built just for them,
// so it takes a moment, and this says so instead of leaving them looking at a page that seems to have stopped.
export function OpeningInvitation() {
  return (
    <div role="status" aria-live="polite" className="text-center">
      <Loader2 className="mx-auto size-7 text-muted-foreground motion-safe:animate-spin" strokeWidth={1.4} aria-hidden />
      <p className="mt-6 text-3xl font-light tracking-[0.1em] uppercase sm:text-4xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
        Opening your invitation
      </p>
      <p className="mt-3 text-[15px] font-light text-muted-foreground">Just a moment while we find your RSVP&hellip;</p>
    </div>
  );
}
