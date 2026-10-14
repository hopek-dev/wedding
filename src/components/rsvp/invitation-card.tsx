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

function ordinalDate(day: string) {
  const m = day.match(/^(\w+) (\d+) (.+)$/);
  if (!m) return day;
  const n = Number(m[2]);
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${m[1]}, ${n}${suffix} ${m[3]}`;
}

export function InvitationCard({
  summary,
  deadline,
  art = { src: VENUE_ART_URL, focus: { x: 50, y: 50 } },
}: {
  summary: InviteSummary;
  deadline: string | null;
  art?: { src: string; focus: { x: number; y: number } };
}) {
  // "Monday 15 March 2027" reads as "Monday, 15th March 2027" on the card.
  const date = summary.dates.map(ordinalDate).join(" · ");
  // The venue and county share a line; the country sits on the next one.
  const venue = summary.venueDetails.map((v) => `${v.name}, Essex`).join(" · ");
  const address = venue ? "United Kingdom" : "";

  return (
    <div className="inv-card">
      <div className="inv-art">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.src} alt="" style={{ objectPosition: `${art.focus.x}% ${art.focus.y}%` }} />
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
