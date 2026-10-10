import type { InviteSummary } from "@/lib/invitation";
import { COUPLE_FULL_NAMES, VENUE_ART_URL } from "@/lib/site";

// The invitation, built to a reference design: a card 396 wide by 565 tall with
// the painting at the top and every line centred at a fixed height down the card
// (as a percentage), so the proportions stay exactly the same at any size. All
// sizes are in cqw (a percentage of the card's width). Styles: envelope.css.
const ROW = {
  mono: "60%",
  name1: "66%",
  and: "70.4%",
  name2: "73.9%",
  invite: "80.1%",
  date: "83.3%",
  venue: "86.5%",
  address: "89.7%",
  rsvp: "94.6%",
} as const;

export function InvitationCard({
  summary,
  deadline,
  art = VENUE_ART_URL,
}: {
  summary: InviteSummary;
  deadline: string | null;
  art?: string;
}) {
  const date = summary.dates.join(" · ");
  const venue = summary.venueDetails.map((v) => v.name).join(" · ");
  const address = summary.venueDetails
    .map((v) => v.address)
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="inv-card">
      <div className="inv-art">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art} alt="" />
      </div>
      <p className="inv-row inv-mono" style={{ top: ROW.mono }}>
        <span>V&amp;H</span>
      </p>
      <p className="inv-row inv-cap-name" style={{ top: ROW.name1 }}>
        {COUPLE_FULL_NAMES[0]}
      </p>
      <p className="inv-row inv-and" style={{ top: ROW.and }}>
        &amp;
      </p>
      <p className="inv-row inv-cap-name" style={{ top: ROW.name2 }}>
        {COUPLE_FULL_NAMES[1]}
      </p>
      <p className="inv-row inv-italic" style={{ top: ROW.invite }}>
        Joyfully Invite You To Their Wedding Celebrations
      </p>
      {date && (
        <p className="inv-row inv-italic" style={{ top: ROW.date }}>
          {date}
        </p>
      )}
      {venue && (
        <p className="inv-row inv-italic" style={{ top: ROW.venue }}>
          {venue}
        </p>
      )}
      {address && (
        <p className="inv-row inv-italic" style={{ top: ROW.address }}>
          {address}
        </p>
      )}
      {deadline && (
        <p className="inv-row inv-hand" style={{ top: ROW.rsvp }}>
          Kindly RSVP by {deadline}
        </p>
      )}
    </div>
  );
}
