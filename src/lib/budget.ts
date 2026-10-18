import type { BudgetItem, Guest, GuestRsvp } from "@/lib/supabase/types";
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

// How many people an event is for, split into adults and children (children are priced differently, see below).
export interface GuestCount {
  adults: number;
  children: number;
  total: number;
}

export const isChild = (g: Pick<Guest, "age_group">) => g.age_group === "child";

// A guest counts toward an event's headcount unless they've been explicitly
// declined for it. This means every newly-added guest counts by default, and
// "deselecting" a guest for an event is just setting their RSVP status to
// Declined on the Guests page -- no separate toggle needed.
//
// Counted from the full guest list minus the declined ones, so a guest who has
// no RSVP record yet for an event (e.g. the event was added after they were)
// still counts instead of silently dropping out.
//
// Plus-ones who are allowed but not named yet count too (they'll be at the
// event even though their name isn't known), unless their host has declined.
// They are counted as adults, since nothing says otherwise until they are named.
export function includedGuestCount(eventId: string, rsvps: GuestRsvp[], guests: Guest[]): GuestCount {
  const declined = new Set(rsvps.filter((r) => r.event_id === eventId && r.status === "declined").map((r) => r.guest_id));
  const attending = guests.filter((g) => !declined.has(g.id));
  const children = attending.filter(isChild).length;
  let unnamed = 0;
  for (const [hostId, n] of unnamedPlusOnes(guests)) if (!declined.has(hostId)) unnamed += n;
  const adults = attending.length - children + unnamed;
  return { adults, children, total: adults + children };
}

export function guestCountsByEvent(eventIds: string[], rsvps: GuestRsvp[], guests: Guest[]): Record<string, GuestCount> {
  return Object.fromEntries(eventIds.map((id) => [id, includedGuestCount(id, rsvps, guests)]));
}

// Everyone on the guest list, whatever events they are at: the figure for "the total budget for N guests".
export function guestListCount(guests: Guest[]): GuestCount {
  const children = guests.filter(isChild).length;
  const adults = guests.length - children + totalUnnamedGuests(guests);
  return { adults, children, total: adults + children };
}

function totalUnnamedGuests(guests: Guest[]) {
  let n = 0;
  for (const v of unnamedPlusOnes(guests).values()) n += v;
  return n;
}

// What a per-guest line costs, and how. Adults are charged the line's rate and children their own rate (the adult
// rate when none is set). If the supplier has a minimum number of guests and there are fewer, the missing places are
// charged at the adult rate, so the cost never drops below what the minimum would be.
export interface PerGuestBreakdown {
  adults: number;
  children: number;
  adultRate: number;
  childRate: number;
  adultCost: number;
  childCost: number;
  minimum: number | null; // the supplier's minimum, if any
  shortfall: number; // guests short of the minimum (0 when there are enough)
  shortfallCost: number;
  total: number;
}

export function perGuestBreakdown(
  item: Pick<BudgetItem, "per_guest_cost" | "child_cost" | "min_guests">,
  count: Pick<GuestCount, "adults" | "children">
): PerGuestBreakdown {
  const adultRate = Number(item.per_guest_cost ?? 0);
  const childRate = item.child_cost != null ? Number(item.child_cost) : adultRate;
  const minimum = item.min_guests != null && Number(item.min_guests) > 0 ? Number(item.min_guests) : null;
  const shortfall = minimum ? Math.max(0, minimum - (count.adults + count.children)) : 0;
  const adultCost = adultRate * count.adults;
  const childCost = childRate * count.children;
  const shortfallCost = adultRate * shortfall;
  return {
    adults: count.adults,
    children: count.children,
    adultRate,
    childRate,
    adultCost,
    childCost,
    minimum,
    shortfall,
    shortfallCost,
    total: adultCost + childCost + shortfallCost,
  };
}

const NO_GUESTS: GuestCount = { adults: 0, children: 0, total: 0 };

// The live estimated cost for a budget item: for a per-guest item linked to
// an event, this is always recalculated from the current guest count rather
// than read from the stored estimated_cost column, so it updates the moment
// a guest is added, removed, declined or marked as a child -- no need to re-save the item.
export function resolvedEstimatedCost(item: BudgetItem, guestCounts: Record<string, GuestCount>) {
  if (item.cost_type === "per_guest" && item.event_id && item.per_guest_cost != null) {
    return perGuestBreakdown(item, guestCounts[item.event_id] ?? NO_GUESTS).total;
  }
  return Number(item.estimated_cost);
}

export interface CategoryTotal {
  category: string;
  estimated: number;
  actual: number;
  paid: number;
}

// Estimated vs actual vs paid spend per category, for the dashboard chart.
// "Actual" falls back to the live estimate when no actual cost has been
// entered yet, matching the same fallback used in the budget page's running
// totals.
export function categoryTotals(items: BudgetItem[], guestCounts: Record<string, GuestCount>): CategoryTotal[] {
  const byCategory = new Map<string, CategoryTotal>();
  for (const item of items) {
    const estimated = resolvedEstimatedCost(item, guestCounts);
    const actual = Number(item.actual_cost ?? estimated);
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
  actual: number;
  variance: number;
}

// Positive variance = over the estimate; negative = under it.
export function totalVariance(items: BudgetItem[], guestCounts: Record<string, GuestCount>): BudgetVariance {
  const estimated = items.reduce((sum, i) => sum + resolvedEstimatedCost(i, guestCounts), 0);
  const actual = items.reduce((sum, i) => sum + Number(i.actual_cost ?? resolvedEstimatedCost(i, guestCounts)), 0);
  return { estimated, actual, variance: actual - estimated };
}
