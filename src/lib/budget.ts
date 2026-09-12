import type { BudgetItem, GuestRsvp } from "@/lib/supabase/types";

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
