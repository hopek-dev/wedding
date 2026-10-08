"use server";

import { createServiceClient } from "@/lib/supabase/server";
import type { SeatAssignment, SeatingTable } from "@/lib/supabase/types";

export async function listSeating() {
  const supabase = createServiceClient();
  const [{ data: tables, error: tablesError }, { data: assignments, error: assignError }] = await Promise.all([
    supabase.from("seating_tables").select("*").order("created_at", { ascending: true }),
    supabase.from("seat_assignments").select("*"),
  ]);
  if (tablesError) throw tablesError;
  if (assignError) throw assignError;
  return {
    tables: (tables ?? []) as SeatingTable[],
    assignments: (assignments ?? []) as SeatAssignment[],
  };
}

export async function createTable(input: {
  event_id: string;
  name: string;
  shape: "round" | "rect";
  capacity: number;
  x: number;
  y: number;
}) {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("seating_tables").insert(input).select("*").single();
  if (error) throw error;
  return data as SeatingTable;
}

export async function updateTable(
  id: string,
  patch: Partial<Pick<SeatingTable, "name" | "shape" | "capacity" | "x" | "y">>
) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("seating_tables").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTable(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("seating_tables").delete().eq("id", id);
  if (error) throw error;
}

// Replaces the whole seating plan for an event in one go. The board works on
// the full plan (seats move, swap and rotate together), so saving it whole is
// simpler and safer than diffing individual moves.
export async function saveEventSeating(
  eventId: string,
  rows: Array<{ table_id: string; guest_id: string; seat_index: number }>
) {
  const supabase = createServiceClient();
  const { error: deleteError } = await supabase.from("seat_assignments").delete().eq("event_id", eventId);
  if (deleteError) throw deleteError;
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("seat_assignments")
    .insert(rows.map((r) => ({ ...r, event_id: eventId })));
  if (error) throw error;
}
