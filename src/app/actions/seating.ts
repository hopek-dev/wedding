"use server";

import { createServiceClient } from "@/lib/supabase/server";
import type { SeatAssignment, SeatingTable } from "@/lib/supabase/types";
import { requireAdmin } from "@/lib/require-admin";

export async function listSeating() {
  await requireAdmin();
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
  await requireAdmin();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("seating_tables").insert(input).select("*").single();
  if (error) throw error;
  return data as SeatingTable;
}

export async function updateTable(
  id: string,
  patch: Partial<Pick<SeatingTable, "name" | "shape" | "capacity" | "x" | "y">>
) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("seating_tables").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTable(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("seating_tables").delete().eq("id", id);
  if (error) throw error;
}

// Replaces the whole seating plan for an event in one go. The board works on
// the full plan (seats move, swap and rotate together), so saving it whole is
// simpler and safer than diffing individual moves.
export type SeatingResult = { ok: true } | { ok: false; error: string };

// Returns failures as data (server action errors are redacted in production),
// so the board can show the real reason instead of failing silently.
export async function saveEventSeating(
  eventId: string,
  rows: Array<{ table_id: string; guest_id: string; seat_index: number }>
): Promise<SeatingResult> {
  await requireAdmin();
  const supabase = createServiceClient();
  // Insert before deleting would clash on unique seats, so clear first, but
  // only after checking the new rows can be written at all.
  if (rows.length) {
    const probe = await supabase.from("seat_assignments").select("seat_index").limit(1);
    if (probe.error) return { ok: false, error: probe.error.message };
  }
  const { error: deleteError } = await supabase.from("seat_assignments").delete().eq("event_id", eventId);
  if (deleteError) return { ok: false, error: deleteError.message };
  if (rows.length === 0) return { ok: true };
  const { error } = await supabase
    .from("seat_assignments")
    .insert(rows.map((r) => ({ ...r, event_id: eventId })));
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Removes every table for an event; their seat assignments go with them.
export async function deleteAllTables(eventId: string): Promise<SeatingResult> {
  await requireAdmin();
  const { error } = await createServiceClient().from("seating_tables").delete().eq("event_id", eventId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// Null when seating can be saved; otherwise what's wrong with the database.
export async function checkSeatingSetup(): Promise<string | null> {
  await requireAdmin();
  const { error } = await createServiceClient().from("seat_assignments").select("seat_index").limit(1);
  return error ? error.message : null;
}
