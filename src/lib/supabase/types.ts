export type EventKey = "ceremony" | "reception" | "boat_party" | string;

export type RsvpStatus = "not_invited" | "invited" | "confirmed" | "declined";
export type GuestSide = "partner_1" | "partner_2" | "both";
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
  full_name: string;
  email: string | null;
  phone: string | null;
  side: GuestSide;
  plus_one_allowed: boolean;
  plus_one_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
    };
  };
}
