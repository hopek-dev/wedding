"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import type { WeddingEvent } from "@/lib/supabase/types";

export async function listEvents() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as WeddingEvent[];
}

export async function updateEvent(id: string, patch: Partial<WeddingEvent>) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("events")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/events");
}

export async function createEvent(input: {
  event_key: string;
  name: string;
  venue_name?: string;
  address?: string;
  notes?: string;
  sort_order?: number;
}) {
  const supabase = createServiceClient();
  let sort_order = input.sort_order;
  if (sort_order === undefined) {
    const { data: last } = await supabase.from("events").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    sort_order = (last?.[0]?.sort_order ?? 0) + 1;
  }
  const { error } = await supabase.from("events").insert({ ...input, sort_order });
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/events");
}

export async function deleteEvent(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/events");
}

export type ReorderResult = { ok: true } | { ok: false; error: string };

// Saves a new event order. The ids arrive in the order you want; every event is
// renumbered 1..n so the order is exact (never two events sharing a number).
// Dashboard, seating tabs, guest columns and the RSVP page all follow it.
export async function reorderEvents(orderedIds: string[]): Promise<ReorderResult> {
  const supabase = createServiceClient();
  const { data: existing, error: readError } = await supabase.from("events").select("id");
  if (readError) return { ok: false, error: readError.message };
  const known = new Set((existing ?? []).map((e: { id: string }) => e.id));
  if (orderedIds.length !== known.size || !orderedIds.every((id) => known.has(id)) || new Set(orderedIds).size !== known.size) {
    return { ok: false, error: "The list of events changed. Refresh the page and try again." };
  }
  const results = await Promise.all(
    orderedIds.map((id, i) => supabase.from("events").update({ sort_order: i + 1 }).eq("id", id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };
  for (const path of ["/", "/events", "/guests", "/seating", "/invitations"]) revalidatePath(path);
  return { ok: true };
}
