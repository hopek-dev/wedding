// Small date helpers for the public wedding website.

const TZ = "Europe/London";

export function eventDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(new Date(iso));
}
