import type { InviteEventLine } from "@/lib/invitation";
import { WEDDING_SITE_LABEL } from "@/lib/site";

// The invitation itself. Everything is sized from --w (the envelope width), so
// the same card works inside the envelope on any screen. Styles: envelope.css.
export function InvitationCard({
  name,
  events,
  deadline,
}: {
  name: string;
  events: InviteEventLine[];
  deadline: string | null;
}) {
  const detailed = events.length > 0 && events.length <= 3 && events.some((e) => e.when);
  return (
    <div className="inv-card">
      <div className="inv-frame">
        <p className="inv-kicker">You are invited</p>
        <p className="inv-names">Vanessa &amp; Hope</p>
        <p className="inv-line">request the pleasure of the company of</p>
        <p className="inv-guest">{name}</p>
        <span className="inv-rule" />
        {detailed ? (
          <ul className="inv-events">
            {events.map((e) => (
              <li key={e.name}>
                <strong>{e.name}</strong>
                {e.when ? ` · ${e.when}` : ""}
                {e.where ? ` · ${e.where}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="inv-line">
            {events.length ? `at their wedding celebrations · ${events.map((e) => e.name).join(" · ")}` : "at their wedding celebrations"}
          </p>
        )}
        {deadline && <p className="inv-reply">Kindly reply by {deadline}</p>}
        <p className="inv-site">Details &amp; gift list: {WEDDING_SITE_LABEL}</p>
      </div>
    </div>
  );
}
