import type { CSSProperties } from "react";
import Link from "next/link";
import { listEvents } from "@/app/actions/events";
import { getRsvpDeadline } from "@/app/actions/settings";
import { InvitationCard } from "@/components/rsvp/invitation-card";
import { inviteSummary } from "@/lib/invitation";
import { formatDeadline } from "@/lib/rsvp-deadline";
import "@/components/rsvp/envelope.css";

export const dynamic = "force-dynamic";

// Paper colours to compare. The first is the current default (see envelope.css).
const PAPERS = [
  { label: "Greige (current)", bg: "#e9e6d9", ink: "#1f1e1b" },
  { label: "Warm ivory", bg: "#f4efe0", ink: "#1f1e1b" },
  { label: "Pale sage", bg: "#dfe4d2", ink: "#2b3026" },
  { label: "Soft blush", bg: "#f0e2dc", ink: "#33282a" },
];

const frame = (width: string, paper?: { bg: string; ink: string }): CSSProperties =>
  ({
    "--w": width,
    ...(paper ? { "--inv-bg": paper.bg, "--inv-ink": paper.ink, "--inv-soft": `${paper.ink}d6` } : {}),
  }) as CSSProperties;

// A page to look at the invitation card without creating an RSVP: the real card
// at phone and desktop size, with your events and deadline, plus paper colours.
// The card carries no guest name; ?name= only picks who the envelope preview is for.
export default async function DesignPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const { name = "Abigail & Kenneth" } = await searchParams;
  const [events, deadline] = await Promise.all([listEvents(), getRsvpDeadline()]);
  const summary = inviteSummary(events);
  const deadlineText = deadline ? formatDeadline(deadline) : null;
  const card = (width: string, paper?: { bg: string; ink: string }) => (
    <div className="design-frame" style={frame(width, paper)}>
      <InvitationCard summary={summary} deadline={deadlineText} />
    </div>
  );

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Invitation design</h1>
        <p className="text-sm text-muted-foreground">
          The invitation card as guests see it, using your real events and deadline.{" "}
          <Link
            href={`/rsvp/preview?name=${encodeURIComponent(name.split(" ")[0])}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            Open the full envelope preview
          </Link>
          .
        </p>
      </div>

      <section className="grid gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">On a phone</h2>
        <div className="flex">{card("359px")}</div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">On a computer</h2>
        <div className="flex">{card("512px")}</div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Paper colours</h2>
        <div className="flex flex-wrap gap-6">
          {PAPERS.map((p) => (
            <div key={p.label} className="grid gap-2">
              {card("300px", p)}
              <p className="text-center text-xs text-muted-foreground">
                {p.label} {p.bg}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
