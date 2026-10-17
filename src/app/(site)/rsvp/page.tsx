import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import { Container, PageShell } from "@/components/site/page-shell";
import { getRsvpDeadline } from "@/app/actions/settings";
import { formatDeadline } from "@/lib/rsvp-deadline";

export const metadata = { title: "RSVP" };
export const revalidate = 120;

// Each guest has a personal invitation link. If this browser has opened theirs before, the RSVP link on the site
// takes them straight back to it (that is done in src/proxy.ts, so this page can be cached).
export default async function RsvpInfoPage() {
  const [rows, deadline] = await Promise.all([getSitePhotos(), getRsvpDeadline()]);
  return (
    <PageShell title="RSVP" hero={resolvePhoto("hero-rsvp", rows)}>
      <Container className="py-12 sm:py-20">
      <div className="mx-auto max-w-xl text-center text-xl leading-[1.9] font-light" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
        <p>Your invitation has its own personal link, which we sent you on WhatsApp. Tap that link to open your invitation and let us know if you can join us.</p>
        {deadline && <p className="mt-4 text-muted-foreground">Please reply by {formatDeadline(deadline)}.</p>}
        <p className="mt-4 text-muted-foreground">Can&apos;t find your link? Just let us know and we&apos;ll send it again.</p>
      </div>
      </Container>
    </PageShell>
  );
}
