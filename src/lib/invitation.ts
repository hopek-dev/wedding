import { guestFullName, type Guest, type WeddingEvent } from "@/lib/supabase/types";

// Helpers shared by the invitation card, the envelope and the link-preview image.

export const PREVIEW_TOKEN = "preview";

export function invitedName(guest: Pick<Guest, "title" | "first_name" | "last_name">) {
  return [guest.title, guestFullName(guest)].filter(Boolean).join(" ");
}

// What a guest is invited to, boiled down for display: the events on one line,
// and the date(s) and venue(s) each shown once instead of repeated per event.
export interface InviteSummary {
  names: string[];
  dates: string[];
  venues: string[];
  dressCodes: string[];
  venueDetails: Array<{ name: string; address: string | null }>;
}


const unique = (values: Array<string | null | undefined>) => [...new Set(values.filter((v): v is string => !!v))];

function formatDay(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(d);
}

// Details that haven't been decided yet are left out rather than shown as "TBD".
function venueParts(events: WeddingEvent[]) {
  const byName = new Map<string, { venue: string; address: string | null }>();
  for (const e of events) {
    const venue = e.venue_name?.trim();
    if (!venue || /^tbd/i.test(venue)) continue;
    const key = venue.toLowerCase();
    const address = e.address?.trim() || null;
    const seen = byName.get(key);
    if (!seen) byName.set(key, { venue, address });
    else if (!seen.address && address) seen.address = address;
  }
  return [...byName.values()];
}

export function inviteSummary(events: WeddingEvent[]): InviteSummary {
  return {
    names: events.map((e) => e.name),
    dates: unique(events.map((e) => formatDay(e.starts_at))),
    venues: venueParts(events).map((v) => [v.venue, v.address].filter(Boolean).join(", ")),
    dressCodes: unique(events.map((e) => e.dress_code?.trim())),
    venueDetails: venueParts(events).map((v) => ({ name: v.venue, address: v.address })),
  };
}
