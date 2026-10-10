import type { Guest } from "@/lib/supabase/types";

// An invitation can cover more than one person: the invited guest and their
// plus-one(s). These build the names used to address it. members[0] is the
// guest who was invited; the rest are plus-ones linked to them.

const clean = (v: string | null | undefined) => v?.trim() ?? "";

function join(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

// "Abdoul & Gladys" - for greetings like "Dear Abdoul & Gladys".
export function partyFirstNames(members: Pick<Guest, "first_name">[]) {
  return join(members.map((m) => clean(m.first_name)).filter(Boolean));
}

// "Mr Sam" for one guest, "Abdoul & Gladys" for a pair.
export function partyGreeting(members: Pick<Guest, "title" | "first_name">[]) {
  if (members.length === 1) return [clean(members[0].title), clean(members[0].first_name)].filter(Boolean).join(" ");
  return partyFirstNames(members);
}

// Plus-ones that are allowed but not named yet, per host. The guest adds the
// name on their RSVP; until then they still count toward the headcount.
export function unnamedPlusOnes(guests: Pick<Guest, "id" | "plus_one_of" | "plus_ones_allowed">[]) {
  const named = new Map<string, number>();
  for (const g of guests) if (g.plus_one_of) named.set(g.plus_one_of, (named.get(g.plus_one_of) ?? 0) + 1);
  const open = new Map<string, number>();
  for (const g of guests) {
    const remaining = (g.plus_ones_allowed ?? 0) - (named.get(g.id) ?? 0);
    if (!g.plus_one_of && remaining > 0) open.set(g.id, remaining);
  }
  return open;
}

export function totalUnnamed(guests: Pick<Guest, "id" | "plus_one_of" | "plus_ones_allowed">[]) {
  return [...unnamedPlusOnes(guests).values()].reduce((a, b) => a + b, 0);
}

// "Abdoul & Gladys Nizeyimana" when they share a surname, otherwise each full
// name. A title (Mr, Dr...) applies to the invited guest only.
export function partyFullName(members: Pick<Guest, "title" | "first_name" | "last_name">[]) {
  if (members.length === 0) return "";
  const lasts = members.map((m) => clean(m.last_name).toLowerCase());
  const shared = lasts[0] && lasts.every((l) => l === lasts[0]) ? clean(members[0].last_name) : "";
  const title = clean(members[0].title);
  if (members.length === 1 || shared) {
    const firsts = join(members.map((m) => clean(m.first_name)).filter(Boolean));
    return [title, firsts, shared].filter(Boolean).join(" ");
  }
  return join(
    members.map((m, i) => [i === 0 ? title : "", clean(m.first_name), clean(m.last_name)].filter(Boolean).join(" "))
  );
}
