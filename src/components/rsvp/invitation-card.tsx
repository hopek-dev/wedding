import { EventNames } from "@/components/rsvp/event-names";
import type { InviteSummary } from "@/lib/invitation";
import { COUPLE_FULL_NAMES, WEDDING_SITE_LABEL } from "@/lib/site";

// The invitation itself: the V&H monogram, the couple's full names, who it is
// for, the date, the venue, and the events. Sizes come from
// --w (card width) and --k (text scale), set by the surrounding CSS, so the
// same card works in the envelope and in the full-size view. Styles: envelope.css.
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
        <p className="inv-mono">
          <span>V&amp;H</span>
        </p>
        <p className="inv-names">{COUPLE_FULL_NAMES[0]}</p>
        <p className="inv-amp">&amp;</p>
        <p className="inv-names">{COUPLE_FULL_NAMES[1]}</p>
        <p className="inv-line inv-gap">request the pleasure of the company of</p>
        <p className="inv-guest">{name}</p>
        <p className="inv-line">at the celebration of their marriage</p>
        {summary.dates.length > 0 && (
          <div className="inv-caps inv-gap">
            {summary.dates.map((d) => (
              <p key={d}>{d}</p>
            ))}
          </div>
        )}
        {summary.venueDetails.length > 0 && (
          <div className="inv-caps inv-gap">
            {summary.venueDetails.map((v) => (
              <p key={v.name}>
                {v.name}
                {v.address && <span className="inv-addr">{v.address}</span>}
              </p>
            ))}
          </div>
        )}
        {summary.names.length > 0 && (
          <p className="inv-script inv-gap">
            <EventNames names={summary.names} />
          </p>
        )}
        {deadline && <p className="inv-reply inv-gap">Kindly reply by {deadline}</p>}
        <p className="inv-site">Details &amp; gift list: {WEDDING_SITE_LABEL}</p>
      </div>
    </div>
  );
}
