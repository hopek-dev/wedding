"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import type { Guest, GuestRsvp, RsvpStatus } from "@/lib/supabase/types";

export async function listGuestsWithRsvps() {
  const supabase = createServiceClient();
  const [{ data: guests, error: guestsError }, { data: rsvps, error: rsvpsError }] =
    await Promise.all([
      supabase.from("guests").select("*").order("first_name", { ascending: true }),
      supabase.from("guest_rsvps").select("*"),
    ]);
  if (guestsError) throw guestsError;
  if (rsvpsError) throw rsvpsError;
  return {
    guests: (guests ?? []) as Guest[],
    rsvps: (rsvps ?? []) as GuestRsvp[],
  };
}

export async function createGuest(input: {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  plus_one_of?: string | null;
  notes?: string;
}) {
  const supabase = createServiceClient();
  const { data: guest, error } = await supabase
    .from("guests")
    .insert(input)
    .select("id")
    .single();
  if (error) throw error;

  // Give every guest a "not_invited" RSVP row for each existing event so the
  // guest list table has something to render per event immediately.
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id");
  if (eventsError) throw eventsError;
  if (events?.length) {
    const { error: rsvpError } = await supabase.from("guest_rsvps").insert(
      events.map((e) => ({ guest_id: guest.id, event_id: e.id, status: "not_invited" as const }))
    );
    if (rsvpError) throw rsvpError;
  }

  revalidatePath("/");
  revalidatePath("/guests");
}

export async function bulkCreateGuests(
  guests: Array<{
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }>
) {
  if (guests.length === 0) return { inserted: 0 };

  const supabase = createServiceClient();
  const { data: inserted, error } = await supabase.from("guests").insert(guests).select("id");
  if (error) throw error;

  const { data: events, error: eventsError } = await supabase.from("events").select("id");
  if (eventsError) throw eventsError;

  if (events?.length && inserted?.length) {
    const rsvpRows = inserted.flatMap((guest: { id: string }) =>
      events.map((event: { id: string }) => ({
        guest_id: guest.id,
        event_id: event.id,
        status: "not_invited" as const,
      }))
    );
    const { error: rsvpError } = await supabase.from("guest_rsvps").insert(rsvpRows);
    if (rsvpError) throw rsvpError;
  }

  revalidatePath("/");
  revalidatePath("/guests");
  return { inserted: inserted?.length ?? 0 };
}

export async function updateGuest(id: string, patch: Partial<Guest>) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("guests")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/guests");
}

export async function deleteGuest(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/guests");
}

export async function upsertRsvp(input: {
  guest_id: string;
  event_id: string;
  status: RsvpStatus;
  headcount?: number;
  dietary_notes?: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("guest_rsvps")
    .upsert(
      { ...input, updated_at: new Date().toISOString() },
      { onConflict: "guest_id,event_id" }
    );
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/guests");
}
