import type { AgeGroup, BudgetItem, Guest, GuestRsvp, RsvpStatus } from "@/lib/supabase/types";
import { unnamedPlusOnes } from "@/lib/party";

export const DEFAULT_BUDGET_CATEGORIES = [
  "Venue",
  "Catering",
  "Attire",
  "Photography & Video",
  "Flowers & Decor",
  "Music & Entertainment",
  "Stationery",
  "Transport",
  "Rings",
  "Hair & Beauty",
  "Gifts & Favors",
  "Other",
];

// The category picker's options: every category already used on an expense,
// plus a starter set of common wedding categories, deduped and sorted so new
// categories typed by the user show up here next time without a schema change.
export function budgetCategoryOptions(items: BudgetItem[]) {
  return Array.from(new Set([...DEFAULT_BUDGET_CATEGORIES, ...items.map((i) => i.category)])).sort(
    (a, b) => a.localeCompare(b)
  );
}

// How many people an event is for, split by age group (teens and children are priced differently, see below).
export interface GuestCount {
  adults: number;
  teens: number;
  children: number;
  total: number;
}

export const ageGroupOf = (g: Pick<Guest, "age_group">): AgeGroup => (g.age_group === "child" || g.age_group === "teen" ? g.age_group : "adult");

const pluralise = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// "120 adults, 6 teens, 4 children": groups with nobody in them are left out (adults are always shown).
export function describeGuests(c: Pick<GuestCount, "adults" | "teens" | "children">) {
  return [pluralise(c.adults, "adult", "adults"), c.teens ? pluralise(c.teens, "teen", "teens") : "", c.children ? pluralise(c.children, "child", "children") : ""]
    .filter(Boolean)
    .join(", ");
}

function countOf(guests: Guest[], unnamedAdults: number): GuestCount {
  const teens = guests.filter((g) => ageGroupOf(g) === "teen").length;
  const children = guests.filter((g) => ageGroupOf(g) === "child").length;
  const adults = guests.length - teens - children + unnamedAdults;
  return { adults, teens, children, total: adults + teens + children };
}

// Two headcounts per event. Everyone INVITED to it (whatever they have replied, so including those who have
// declined) is who the estimate is priced for: the plan if the whole invite list came. Those who have ACCEPTED are
// who the actual is priced for: what it costs as replies come in.
export interface EventGuests {
  invited: GuestCount;
  accepted: GuestCount;
}

// A guest is invited to an event if their RSVP row is anything but "not invited" (invited, accepted or declined). A
// guest with no row for an event (say the event was added after them) is not invited to it.
//
// Plus-ones who are allowed but not named yet count too: they are invited when their host is, and counted as
// accepted when their host has accepted (they'll be at the event even though their name isn't known). They are
// counted as adults, since nothing says otherwise until they are named.
function countGroup(guests: Guest[], statusOf: (id: string) => RsvpStatus | undefined): EventGuests {
  const invitedStatus = (id: string) => {
    const s = statusOf(id);
    return s === "invited" || s === "confirmed" || s === "declined";
  };
  const invited = guests.filter((g) => invitedStatus(g.id));
  const accepted = guests.filter((g) => statusOf(g.id) === "confirmed");
  let unnamedInvited = 0;
  let unnamedAccepted = 0;
  for (const [hostId, n] of unnamedPlusOnes(guests)) {
    if (invitedStatus(hostId)) unnamedInvited += n;
    if (statusOf(hostId) === "confirmed") unnamedAccepted += n;
  }
  return { invited: countOf(invited, unnamedInvited), accepted: countOf(accepted, unnamedAccepted) };
}

export function eventGuests(eventId: string, rsvps: GuestRsvp[], guests: Guest[]): EventGuests {
  const status = new Map(rsvps.filter((r) => r.event_id === eventId).map((r) => [r.guest_id, r.status]));
  return countGroup(guests, (id) => status.get(id));
}

// The key for "everyone on the guest list", used by a per-guest expense that isn't tied to one event (say, a package
// covering the ceremony and the reception). A guest is invited if they are invited to any event, and accepted if
// they have accepted any.
export const ALL_GUESTS = "all";

export function guestCountsByEvent(eventIds: string[], rsvps: GuestRsvp[], guests: Guest[]): Record<string, EventGuests> {
  const any = new Map<string, RsvpStatus>();
  for (const r of rsvps) {
    const rank = { not_invited: 0, declined: 1, invited: 2, confirmed: 3 } as const;
    const prev = any.get(r.guest_id);
    if (!prev || rank[r.status] > rank[prev]) any.set(r.guest_id, r.status);
  }
  return {
    ...Object.fromEntries(eventIds.map((id) => [id, eventGuests(id, rsvps, guests)])),
    [ALL_GUESTS]: countGroup(guests, (id) => any.get(id)),
  };
}

// Everyone on the guest list, whether or not they have been invited yet.
export function guestListCount(guests: Guest[]): GuestCount {
  let unnamed = 0;
  for (const v of unnamedPlusOnes(guests).values()) unnamed += v;
  return countOf(guests, unnamed);
}

// What a per-guest line costs, and how. Adults are charged the line's rate, teens and children their own rates (the
// adult rate when none is set). If the supplier has a minimum number of guests and there are fewer, the missing places
// are charged at the adult rate, so the cost never drops below what the minimum would be.
export interface PerGuestBreakdown {
  adults: number;
  teens: number;
  children: number;
  adultRate: number;
  teenRate: number;
  childRate: number;
  adultCost: number;
  teenCost: number;
  childCost: number;
  minimum: number | null; // the supplier's minimum, if any
  shortfall: number; // guests short of the minimum (0 when there are enough)
  shortfallCost: number;
  total: number;
}

export function perGuestBreakdown(
  item: Pick<BudgetItem, "per_guest_cost" | "child_cost" | "teen_cost" | "min_guests">,
  count: Pick<GuestCount, "adults" | "teens" | "children">
): PerGuestBreakdown {
  const adultRate = Number(item.per_guest_cost ?? 0);
  const teenRate = item.teen_cost != null ? Number(item.teen_cost) : adultRate;
  const childRate = item.child_cost != null ? Number(item.child_cost) : adultRate;
  const minimum = item.min_guests != null && Number(item.min_guests) > 0 ? Number(item.min_guests) : null;
  const shortfall = minimum ? Math.max(0, minimum - (count.adults + count.teens + count.children)) : 0;
  const adultCost = adultRate * count.adults;
  const teenCost = teenRate * count.teens;
  const childCost = childRate * count.children;
  const shortfallCost = adultRate * shortfall;
  return {
    adults: count.adults,
    teens: count.teens,
    children: count.children,
    adultRate,
    teenRate,
    childRate,
    adultCost,
    teenCost,
    childCost,
    minimum,
    shortfall,
    shortfallCost,
    total: adultCost + teenCost + childCost + shortfallCost,
  };
}

export const NO_GUESTS: GuestCount = { adults: 0, teens: 0, children: 0, total: 0 };
export const NO_EVENT_GUESTS: EventGuests = { invited: NO_GUESTS, accepted: NO_GUESTS };

const isPerGuest = (item: BudgetItem) => item.cost_type === "per_guest" && item.per_guest_cost != null;
const guestsFor = (item: BudgetItem, counts: Record<string, EventGuests>) => counts[item.event_id ?? ALL_GUESTS] ?? NO_EVENT_GUESTS;

// The live ESTIMATED cost of a budget item. For a per-guest item it is priced for everyone invited (linked to an
// event, that event's invited guests; not linked, everyone invited to anything), and recalculated whenever a guest is
// added, invited, or moved between adult, teen and child -- no need to re-save the item.
export function resolvedEstimatedCost(item: BudgetItem, counts: Record<string, EventGuests>) {
  if (isPerGuest(item)) return perGuestBreakdown(item, guestsFor(item, counts).invited).total;
  return Number(item.estimated_cost);
}

// The ACTUAL cost so far, or null when there is none to count yet. Actuals only add up actual figures: for a per-guest
// item it is priced for the guests who have accepted (so any minimum number of guests shows up as places paid for but
// not yet filled); for anything else it is the actual amount entered, and an expense with none entered has no actual
// (it is never filled in from the estimate).
export function resolvedActualCost(item: BudgetItem, counts: Record<string, EventGuests>): number | null {
  if (isPerGuest(item)) return perGuestBreakdown(item, guestsFor(item, counts).accepted).total;
  return item.actual_cost != null ? Number(item.actual_cost) : null;
}

// What an item is expected to cost in the end, for working out what is still owed: the actual where there is one,
// otherwise the estimate. (A per-guest item is expected to cost its estimate, for everyone invited.)
export function resolvedExpectedCost(item: BudgetItem, counts: Record<string, EventGuests>) {
  if (isPerGuest(item)) return resolvedEstimatedCost(item, counts);
  return item.actual_cost != null ? Number(item.actual_cost) : resolvedEstimatedCost(item, counts);
}

// How much of an item's estimate is fixed and how much depends on the number of guests. A flat cost is all fixed. On
// a per-guest item with a minimum number of guests, the value of that minimum (the minimum x the adult rate) is
// fixed: it is paid whoever comes. Only the cost above it depends on the guests.
export function costSplit(item: BudgetItem, counts: Record<string, EventGuests>) {
  const total = resolvedEstimatedCost(item, counts);
  if (!isPerGuest(item)) return { fixed: total, variable: 0 };
  const minimumValue = item.min_guests && Number(item.min_guests) > 0 ? Number(item.min_guests) * Number(item.per_guest_cost) : 0;
  const fixed = Math.min(total, minimumValue);
  return { fixed, variable: total - fixed };
}

export interface CategoryTotal {
  category: string;
  estimated: number;
  actual: number;
  paid: number;
}

// Estimated vs actual vs paid spend per category, for the dashboard chart.
// "Actual" only adds up the actual figures that exist (see resolvedActualCost): an
// expense with no actual entered adds nothing to it.
export function categoryTotals(items: BudgetItem[], guestCounts: Record<string, EventGuests>): CategoryTotal[] {
  const byCategory = new Map<string, CategoryTotal>();
  for (const item of items) {
    const estimated = resolvedEstimatedCost(item, guestCounts);
    const actual = resolvedActualCost(item, guestCounts) ?? 0;
    const paid = Number(item.amount_paid);
    const existing = byCategory.get(item.category);
    if (existing) {
      existing.estimated += estimated;
      existing.actual += actual;
      existing.paid += paid;
    } else {
      byCategory.set(item.category, { category: item.category, estimated, actual, paid });
    }
  }
  return Array.from(byCategory.values()).sort((a, b) => b.estimated - a.estimated);
}

export interface BudgetVariance {
  estimated: number;
  actual: number; // only the actuals that exist
  variance: number; // over (+) or under (-) the estimate, on the expenses that have an actual
  expected: number; // the actual where there is one, otherwise the estimate: what the whole budget is expected to come to
}

export function totalVariance(items: BudgetItem[], guestCounts: Record<string, EventGuests>): BudgetVariance {
  let estimated = 0;
  let actual = 0;
  let variance = 0;
  let expected = 0;
  for (const i of items) {
    const est = resolvedEstimatedCost(i, guestCounts);
    const act = resolvedActualCost(i, guestCounts);
    estimated += est;
    expected += resolvedExpectedCost(i, guestCounts);
    if (act != null) {
      actual += act;
      variance += act - est;
    }
  }
  return { estimated, actual, variance, expected };
}
