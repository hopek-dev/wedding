import { guestFullName, type Guest, type SeatAssignment, type SeatingTable } from "@/lib/supabase/types";

export const MIN_SEATS = 6;
export const MAX_SEATS = 20;
export const DEFAULT_SEATS = 10;
export const SEAT_OPTIONS = Array.from({ length: MAX_SEATS - MIN_SEATS + 1 }, (_, i) => MIN_SEATS + i);

export interface PlanTable {
  id: string;
  name: string;
  seats: (string | null)[]; // guest id per seat, clockwise from the top
}

export interface PlanGuest {
  id: string;
  first: string;
  last: string;
  name: string;
  fam: string;
  hue: number | null; // family colour; null for guests who are on their own
}

// ---------- guests and families ----------

// Guests sharing a surname (and plus-ones, who take their host's surname)
// form a family. Families of two or more get a colour and are seated together.
export function buildPlanGuests(guests: Guest[]): Map<string, PlanGuest> {
  const byId = new Map(guests.map((g) => [g.id, g]));
  const famOf = (g: Guest) => {
    const host = g.plus_one_of ? byId.get(g.plus_one_of) : undefined;
    return (host ?? g).last_name?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  };
  const counts = new Map<string, number>();
  for (const g of guests) {
    const f = famOf(g);
    if (f) counts.set(f, (counts.get(f) ?? 0) + 1);
  }
  const families = [...counts.entries()].filter(([, n]) => n > 1).map(([f]) => f).sort();
  return new Map(
    guests.map((g) => {
      const fam = famOf(g);
      const i = families.indexOf(fam);
      return [
        g.id,
        {
          id: g.id,
          first: g.first_name,
          last: g.last_name ?? "",
          name: guestFullName(g),
          fam,
          hue: i < 0 ? null : (i * 47 + 12) % 360,
        },
      ];
    })
  );
}

// ---------- plan state ----------

export function emptySeats(n: number): (string | null)[] {
  return Array<string | null>(n).fill(null);
}

export function buildPlans(tables: SeatingTable[], assignments: SeatAssignment[]): Record<string, PlanTable[]> {
  const plans: Record<string, PlanTable[]> = {};
  for (const t of tables) {
    const seats = emptySeats(t.capacity);
    for (const a of assignments) {
      if (a.table_id === t.id && a.seat_index < t.capacity && seats[a.seat_index] === null) {
        seats[a.seat_index] = a.guest_id;
      }
    }
    (plans[t.event_id] ??= []).push({ id: t.id, name: t.name, seats });
  }
  return plans;
}

export function locate(tables: PlanTable[], id: string) {
  for (const t of tables) {
    const s = t.seats.indexOf(id);
    if (s >= 0) return { t, s };
  }
  return null;
}

export type Dest = { type: "pool" } | { type: "table"; t: string } | { type: "seat"; t: string; s: number };

// Moves a guest. Dropping on an occupied seat swaps if the guest was seated,
// otherwise the displaced guest goes back to the unseated list.
export function place(
  tables: PlanTable[],
  id: string,
  dest: Dest,
  nameOf: (id: string) => string
): { tables: PlanTable[]; msg: string | null; ok: boolean } {
  const ts = tables.map((t) => ({ ...t, seats: t.seats.slice() }));
  const src = locate(ts, id);
  if (dest.type === "pool") {
    if (src) src.t.seats[src.s] = null;
    return { tables: ts, msg: null, ok: true };
  }
  const t = ts.find((x) => x.id === dest.t);
  if (!t) return { tables, msg: null, ok: false };
  const s = dest.type === "seat" ? dest.s : t.seats.indexOf(null);
  if (dest.type === "table" && s < 0) return { tables, msg: `${t.name} is full.`, ok: false };
  const occ = t.seats[s];
  if (occ === id) return { tables, msg: null, ok: false };
  t.seats[s] = id;
  let msg: string | null = null;
  if (src) src.t.seats[src.s] = occ;
  else if (occ !== null) msg = `${nameOf(occ)} moved to unseated.`;
  return { tables: ts, msg, ok: true };
}

// Seats the given guests family by family, biggest families first, always
// into the table with the most free seats. Replaces any existing seating.
export function autoSeat(tables: PlanTable[], guests: PlanGuest[]): PlanTable[] {
  const ts = tables.map((t) => ({ ...t, seats: emptySeats(t.seats.length) }));
  if (ts.length === 0) return ts;
  const famCount = new Map<string, number>();
  for (const g of guests) if (g.fam) famCount.set(g.fam, (famCount.get(g.fam) ?? 0) + 1);
  const groups = new Map<string, string[]>();
  for (const g of guests) {
    const key = g.fam && (famCount.get(g.fam) ?? 0) > 1 ? g.fam : `~${g.id}`;
    groups.set(key, [...(groups.get(key) ?? []), g.id]);
  }
  const free = (t: PlanTable) => t.seats.filter((x) => x === null).length;
  const ordered = [...groups.values()].sort((a, b) => b.length - a.length);
  for (const ids of ordered) {
    const rest = ids.slice();
    while (rest.length) {
      let best = ts[0];
      for (const t of ts) if (free(t) > free(best)) best = t;
      const f = free(best);
      if (!f) break;
      for (const id of rest.splice(0, Math.min(f, rest.length))) best.seats[best.seats.indexOf(null)] = id;
    }
  }
  return ts;
}

// Resizes a table. Guests in removed seats move into free seats; the count of
// guests that no longer fit is returned.
export function resizeTable(t: PlanTable, n: number) {
  const seats = t.seats.slice(0, n);
  while (seats.length < n) seats.push(null);
  let lost = 0;
  for (const g of t.seats.slice(n)) {
    if (g === null) continue;
    const i = seats.indexOf(null);
    if (i >= 0) seats[i] = g;
    else lost += 1;
  }
  return { table: { ...t, seats }, lost };
}

export function rotateTable(t: PlanTable, dir: 1 | -1): PlanTable {
  const n = t.seats.length;
  const seats = emptySeats(n);
  t.seats.forEach((g, i) => {
    seats[(i + dir + n) % n] = g;
  });
  return { ...t, seats };
}

export function seatRows(tables: PlanTable[]) {
  return tables.flatMap((t) =>
    t.seats.flatMap((g, i) => (g === null ? [] : [{ table_id: t.id, guest_id: g, seat_index: i }]))
  );
}

// ---------- geometry ----------

export const PILL_W = 68;
export const PILL_H = 34;

export function geom(n: number) {
  const r = Math.max(112, Math.round((n * 76) / (2 * Math.PI)));
  const size = 2 * r + PILL_W + 8;
  return { r, size, c: size / 2, linen: 2 * (r - 44) };
}
