// The RSVP deadline is a calendar date (YYYY-MM-DD). RSVPs stay open for that
// whole day and close once it is past, judged in London time so the cut-off
// doesn't depend on where the server runs or where the guest is.

const TZ = "Europe/London";

export function todayInLondon(now = new Date()) {
  // The en-CA locale formats dates as YYYY-MM-DD, which compares correctly as text.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function isRsvpClosed(deadline: string | null, now = new Date()) {
  return !!deadline && todayInLondon(now) > deadline;
}

export function formatDeadline(deadline: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${deadline}T00:00:00Z`)
  );
}

// Whole days from today until the deadline (0 = last day, negative = closed).
export function daysUntil(deadline: string, now = new Date()) {
  const ms = (d: string) => Date.parse(`${d}T00:00:00Z`);
  return Math.round((ms(deadline) - ms(todayInLondon(now))) / 86_400_000);
}

export const DEADLINE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
