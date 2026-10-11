import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Container, PageShell } from "@/components/site/page-shell";
import { getRsvpDeadline } from "@/app/actions/settings";
import { formatDeadline } from "@/lib/rsvp-deadline";

export const metadata = { title: "RSVP" };
export const dynamic = "force-dynamic";

// Each guest has a personal invitation link. If this browser has opened theirs before,
// the RSVP link on the site takes them straight back to it.
export default async function RsvpInfoPage() {
  const rows = await getSitePhotos();
  const token = (await cookies()).get("my-invite")?.value;
  if (token && /^[a-f0-9]{8,64}$/i.test(token)) redirect(`/rsvp/${token}`);
  const deadline = await getRsvpDeadline();
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
