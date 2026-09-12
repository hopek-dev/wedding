import type { BudgetItem, GuestRsvp } from "@/lib/supabase/types";

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

// A guest counts toward an event's headcount unless they've been explicitly
// declined for it. This means every newly-added guest counts by default, and
// "deselecting" a guest for an event is just setting their RSVP status to
// Declined on the Guests page -- no separate toggle needed.
export function includedGuestCount(eventId: string, rsvps: GuestRsvp[]) {
  return rsvps.filter((r) => r.event_id === eventId && r.status !== "declined").length;
}

export function guestCountsByEvent(eventIds: string[], rsvps: GuestRsvp[]) {
  return Object.fromEntries(eventIds.map((id) => [id, includedGuestCount(id, rsvps)]));
}

// The live estimated cost for a budget item: for a per-guest item linked to
// an event, this is always recalculated from the current guest count rather
// than read from the stored estimated_cost column, so it updates the moment
// a guest is added, removed, or declined -- no need to re-save the item.
export function resolvedEstimatedCost(item: BudgetItem, guestCounts: Record<string, number>) {
  if (item.cost_type === "per_guest" && item.event_id && item.per_guest_cost != null) {
    return item.per_guest_cost * (guestCounts[item.event_id] ?? 0);
  }
  return Number(item.estimated_cost);
}

export interface CategoryTotal {
  category: string;
  estimated: number;
  actual: number;
}

// Estimated vs actual spend per category, for the dashboard chart. "Actual"
// falls back to the live estimate when no actual cost has been entered yet,
// matching the same fallback used in the budget page's running totals.
export function categoryTotals(items: BudgetItem[], guestCounts: Record<string, number>): CategoryTotal[] {
  const byCategory = new Map<string, CategoryTotal>();
  for (const item of items) {
    const estimated = resolvedEstimatedCost(item, guestCounts);
    const actual = Number(item.actual_cost ?? estimated);
    const existing = byCategory.get(item.category);
    if (existing) {
      existing.estimated += estimated;
      existing.actual += actual;
    } else {
      byCategory.set(item.category, { category: item.category, estimated, actual });
    }
  }
  return Array.from(byCategory.values()).sort((a, b) => b.estimated - a.estimated);
}
