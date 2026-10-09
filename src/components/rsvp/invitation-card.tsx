import { EventNames } from "@/components/rsvp/event-names";
import type { InviteSummary } from "@/lib/invitation";
import { WEDDING_SITE_LABEL } from "@/lib/site";

// The invitation itself. Everything is sized from --w (the envelope width), so
// the same card works inside the envelope on any screen. Styles: envelope.css.
export function InvitationCard({
  name,
  summary,
  deadline,
}: {
  name: string;
  summary: InviteSummary;
  deadline: string | null;
}) {
  return (
    <div className="inv-card">
      <div className="inv-frame">
        <p className="inv-kicker">You are invited</p>
        <p className="inv-names">Vanessa &amp; Hope</p>
        <p className="inv-line">request the pleasure of the company of</p>
        <p className="inv-guest">{name}</p>
        <span className="inv-rule" />
        {summary.names.length > 0 ? (
          <p className="inv-detail inv-detail-names">
            <EventNames names={summary.names} />
          </p>
        ) : (
          <p className="inv-line">at their wedding celebrations</p>
        )}
        {summary.dates.length > 0 && <p className="inv-detail">{summary.dates.join(" · ")}</p>}
        {summary.venues.length > 0 && <p className="inv-detail">{summary.venues.join(" · ")}</p>}
        {deadline && <p className="inv-reply">Kindly reply by {deadline}</p>}
        <p className="inv-site">Details &amp; gift list: {WEDDING_SITE_LABEL}</p>
      </div>
    </div>
  );
}
