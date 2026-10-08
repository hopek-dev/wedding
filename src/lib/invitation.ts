import { guestFullName, type Guest, type WeddingEvent } from "@/lib/supabase/types";

// Helpers shared by the invitation card, the envelope and the link-preview image.

export const PREVIEW_TOKEN = "preview";

export function invitedName(guest: Pick<Guest, "title" | "first_name" | "last_name">) {
  return [guest.title, guestFullName(guest)].filter(Boolean).join(" ");
}

export interface InviteEventLine {
  name: string;
  when: string | null;
  where: string | null;
}

function formatWhen(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Europe/London",
  })
    .format(d)
    .replace(/\s/g, "")
    .toLowerCase();
  return `${date}, ${time}`;
}

// Events as they read on the card. Details that haven't been decided yet are
// left out rather than shown as "TBD".
export function inviteEventLines(events: WeddingEvent[]): InviteEventLine[] {
  return events.map((e) => ({
    name: e.name,
    when: formatWhen(e.starts_at),
    where: e.venue_name && !/^tbd/i.test(e.venue_name) ? e.venue_name : null,
  }));
}
