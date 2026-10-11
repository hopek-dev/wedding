import type { Guest } from "@/lib/supabase/types";
import { unnamedPlusOnes } from "@/lib/party";

// The guest list split by tag (in this app a tag says whose side or group a guest is on, e.g. "Hope" or
// "Vanessa"). Counts every person once: named guests (including plus-ones already named) by their reply
// status, plus the +1s that are allowed but not named yet, which count toward the total and nothing else.

export type GuestStatus = "confirmed" | "awaiting" | "declined" | "none";

export interface TagRow {
  tag: string; // "" = no tag
  total: number;
  confirmed: number;
  awaiting: number;
  declined: number;
  notInvited: number;
  unnamed: number; // +1s still to be named
}

export function tagSplit(guests: Guest[], status: Map<string, GuestStatus>): TagRow[] {
  const rows = new Map<string, TagRow>();
  const rowFor = (tag: string | null) => {
    const key = (tag ?? "").trim();
    let r = rows.get(key);
    if (!r) rows.set(key, (r = { tag: key, total: 0, confirmed: 0, awaiting: 0, declined: 0, notInvited: 0, unnamed: 0 }));
    return r;
  };
  for (const g of guests) {
    const r = rowFor(g.tag);
    r.total++;
    const s = status.get(g.id) ?? "none";
    if (s === "confirmed") r.confirmed++;
    else if (s === "awaiting") r.awaiting++;
    else if (s === "declined") r.declined++;
    else r.notInvited++;
  }
  const byId = new Map(guests.map((g) => [g.id, g]));
  for (const [hostId, n] of unnamedPlusOnes(guests)) {
    const r = rowFor(byId.get(hostId)?.tag ?? null);
    r.unnamed += n;
    r.total += n;
  }
  // biggest group first; people with no tag last
  return [...rows.values()].sort((a, b) => (a.tag === "" ? 1 : b.tag === "" ? -1 : b.total - a.total));
}
