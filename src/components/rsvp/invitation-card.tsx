import { EventNames } from "@/components/rsvp/event-names";
import type { InviteSummary } from "@/lib/invitation";
import { COUPLE_FULL_NAMES, VENUE_SKETCH_URL } from "@/lib/site";

// The invitation itself: a small sketch of the venue with the V&H monogram
// embossed in its middle, the couple's full names, who it is for (first names),
// the date, the venue, and the events. Sizes come from --w (card width) and --k
// (text scale), set by the surrounding CSS, so the same card works in the
// envelope and in the full-size view. Styles: envelope.css.
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
        <div className="inv-sketch">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="inv-sketch-img" src={VENUE_SKETCH_URL} alt="" />
          <p className="inv-mono">
            <span>V&amp;H</span>
          </p>
        </div>
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
          <p className="inv-events-line inv-gap">
            <EventNames names={summary.names} />
          </p>
        )}
        {deadline && <p className="inv-reply inv-gap">Kindly reply by {deadline}</p>}
      </div>
    </div>
  );
}
