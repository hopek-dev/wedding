export type EventKey = "ceremony" | "reception" | "boat_party" | string;

export type RsvpStatus = "not_invited" | "invited" | "confirmed" | "declined";
export type BudgetStatus = "planned" | "booked" | "paid";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface WeddingEvent {
  id: string;
  event_key: EventKey;
  name: string;
  venue_name: string | null;
  address: string | null;
  starts_at: string | null;
  ends_at: string | null;
  dress_code: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  plus_one_of: string | null;
  title: string | null;
  tag: string | null;
  plus_ones_allowed: number;
  last_emailed_at: string | null;
  rsvp_token: string;
  rsvp_responded_at: string | null;
  invite_sent_at: string | null;
  invite_channel: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeatingTable {
  id: string;
  event_id: string;
  name: string;
  shape: "round" | "rect";
  capacity: number;
  x: number;
  y: number;
  created_at: string;
}

export interface SeatAssignment {
  id: string;
  event_id: string;
  table_id: string;
  guest_id: string;
  seat_index: number;
  created_at: string;
}

export function guestFullName(guest: Pick<Guest, "first_name" | "last_name">) {
  return [guest.first_name, guest.last_name].filter(Boolean).join(" ");
}

export interface GuestRsvp {
  id: string;
  guest_id: string;
  event_id: string;
  status: RsvpStatus;
  headcount: number;
  dietary_notes: string | null;
  updated_at: string;
}

export type BudgetCostType = "flat" | "per_guest";

export interface BudgetItem {
  id: string;
  category: string;
  vendor_name: string | null;
  event_id: string | null;
  estimated_cost: number;
  actual_cost: number | null;
  amount_paid: number;
  due_date: string | null;
  status: BudgetStatus;
  cost_type: BudgetCostType;
  per_guest_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  event_id: string | null;
  category: string;
  start_date: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const TASK_CATEGORIES = [
  "General",
  "Attire",
  "Travel",
  "Admin & Legal",
  "Vendors",
  "Decor & Flowers",
  "Gifts & Favors",
  "Beauty",
  "Music & Entertainment",
  "Photography",
  "Other",
] as const;

export interface Database {
  public: {
    Tables: {
      events: { Row: WeddingEvent; Insert: Partial<WeddingEvent>; Update: Partial<WeddingEvent> };
      guests: { Row: Guest; Insert: Partial<Guest>; Update: Partial<Guest> };
      guest_rsvps: { Row: GuestRsvp; Insert: Partial<GuestRsvp>; Update: Partial<GuestRsvp> };
      budget_items: { Row: BudgetItem; Insert: Partial<BudgetItem>; Update: Partial<BudgetItem> };
      seating_tables: { Row: SeatingTable; Insert: Partial<SeatingTable>; Update: Partial<SeatingTable> };
      seat_assignments: { Row: SeatAssignment; Insert: Partial<SeatAssignment>; Update: Partial<SeatAssignment> };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
    };
  };
}
