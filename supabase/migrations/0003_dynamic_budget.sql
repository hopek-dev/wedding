-- Let a budget line item (e.g. reception catering, boat party tickets) price
-- itself per attending guest instead of a fixed one-off amount. The guest
-- count driving the calculation is the guests NOT marked "declined" for that
-- item's linked event in guest_rsvps -- i.e. deselecting a guest for an event
-- (setting their RSVP to Declined on the Guests page) removes them from any
-- per-guest cost calculation for that event, live, with no extra UI needed.

alter table budget_items add column cost_type text not null default 'flat' check (cost_type in ('flat', 'per_guest'));
alter table budget_items add column per_guest_cost numeric(10, 2);
