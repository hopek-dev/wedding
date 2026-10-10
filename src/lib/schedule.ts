import { VENUE, WEDDING } from "@/lib/site-content";

// The wedding-day schedule shown on the public website. Times are London local time,
// written exactly as they appear on the wedding website. This is separate from the planner's
// RSVP events (Ceremony, Reception, Evening Party), because things like "Photo Time!" are
// part of the day but aren't something guests reply to.

export interface ScheduleItem {
  id: string; // used in the calendar download address
  name: string;
  date: string; // YYYY-MM-DD, London
  start: string; // HH:MM, London
  endDate: string; // YYYY-MM-DD, London (differs from date when it runs past midnight)
  end: string; // HH:MM, London
  venue: string;
  dressCode?: string;
  note?: string;
}

export const VENUE_FULL_NAME = "Mulberry House - Wedding and Event Venue in Essex";

export const SCHEDULE: ScheduleItem[] = [
  {
    id: "ceremony",
    name: "Ceremony",
    date: WEDDING.date,
    start: "13:30",
    endDate: WEDDING.date,
    end: "14:00",
    venue: VENUE_FULL_NAME,
    dressCode: "Cocktail Attire",
    note: "We\u2019re tying the knot!",
  },
  { id: "photo-time", name: "Photo Time!", date: WEDDING.date, start: "14:00", endDate: WEDDING.date, end: "15:30", venue: VENUE_FULL_NAME },
  { id: "wedding-reception", name: "Wedding Reception", date: WEDDING.date, start: "15:30", endDate: WEDDING.date, end: "19:30", venue: VENUE_FULL_NAME },
  { id: "dance-the-night-away", name: "Dance the Night Away!", date: WEDDING.date, start: "19:30", endDate: "2027-03-16", end: "00:00", venue: VENUE_FULL_NAME },
];

// Google Maps turn-by-turn directions to the venue.
export const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${VENUE.lat},${VENUE.lng}`;

// "13:30 to 14:00". A finish at midnight on the next day is shown as "00:00" with the day it ends on.
export function timeRange(item: ScheduleItem) {
  const next = item.endDate !== item.date ? " (ends " + new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${item.endDate}T00:00:00Z`)) + ")" : "";
  return `${item.start} to ${item.end}${next}`;
}

// ---------- calendar files ----------

// Converts a London wall-clock time to UTC, including summer time, so the calendar entry
// is right whatever time zone the guest's phone is in.
function londonToUtc(date: string, time: string) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const offsetOf = (ms: number) => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", hourCycle: "h23" }).formatToParts(new Date(ms));
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - ms;
  };
  return new Date(asUtc - offsetOf(asUtc - offsetOf(asUtc)));
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

function vevent(item: ScheduleItem) {
  const description = [item.note, item.dressCode ? `Dress code: ${item.dressCode}` : "", `${WEDDING.names}`].filter(Boolean).join("\n");
  return [
    "BEGIN:VEVENT",
    `UID:${item.id}-${item.date}@vanessa-and-hope`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(londonToUtc(item.date, item.start))}`,
    `DTEND:${stamp(londonToUtc(item.endDate, item.end))}`,
    `SUMMARY:${esc(`${item.name} \u00b7 ${WEDDING.names}`)}`,
    `LOCATION:${esc(`${VENUE.name}, ${VENUE.address.join(", ")}`)}`,
    `GEO:${VENUE.lat};${VENUE.lng}`,
    `DESCRIPTION:${esc(description)}`,
    "END:VEVENT",
  ].join("\r\n");
}

// A calendar file for one item, or for the whole day when no item is given.
export function icsFor(items: ScheduleItem[]) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Vanessa and Hope//Wedding//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...items.map(vevent), "END:VCALENDAR", ""].join("\r\n");
}
