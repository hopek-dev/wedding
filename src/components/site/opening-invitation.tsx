import { Loader2 } from "lucide-react";

// "Opening your invitation": shown while a guest's personal page is on its way. That page is built just for them,
// so it takes a moment, and this says so instead of leaving them looking at a page that seems to have stopped.
// `compact` is the one-line version used as a small notice over the page they are leaving.
export function OpeningInvitation({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-2.5 text-[13px] font-light tracking-wide">
        <Loader2 className="size-4 motion-safe:animate-spin" strokeWidth={1.6} aria-hidden />
        Opening your invitation&hellip;
      </div>
    );
  }
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
