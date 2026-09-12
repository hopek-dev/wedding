"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import type { WeddingEvent } from "@/lib/supabase/types";

export async function listEvents() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("sort_order", { ascending: true });
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
  const { error } = await supabase.from("events").insert(input);
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
