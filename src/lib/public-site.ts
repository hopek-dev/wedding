// Small date helpers for the public wedding website.

import { formatOrdinalDate } from "@/lib/format";

const TZ = "Europe/London";

export function eventDay(iso: string) {
  return formatOrdinalDate(new Date(iso), { weekday: "long", month: "long", year: "numeric", timeZone: TZ });
}
