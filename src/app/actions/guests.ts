"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import type { Guest, GuestRsvp, RsvpStatus } from "@/lib/supabase/types";
import type { ImportedGuest } from "@/lib/guest-import";

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
  title?: string;
  tag?: string;
  plus_ones_allowed?: number;
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

const nameKey = (first: string, last?: string | null) =>
  [first, last].filter(Boolean).join(" ").trim().toLowerCase().replace(/\s+/g, " ");

function splitName(full: string) {
  const [first, ...rest] = full.split(" ").filter(Boolean);
  return { first_name: first ?? full, last_name: rest.join(" ") || undefined };
}

// How an upload treats guests that are already on the list (matched by full name):
//  - skip:     keep them untouched and only add new guests.
//  - override: update them with whatever the sheet provides (blank cells never
//              erase existing data); RSVPs and seating are kept.
//  - replace:  swap out the entire list for the sheet. Everyone not in the
//              sheet is deleted, along with their RSVPs and seats.
export type ImportMode = "skip" | "override" | "replace";

// Plus-ones are linked either from a "Plus one of <name>" note or by creating a
// guest for each name in the "Plus Ones" cell.
async function runBulkImport(guests: ImportedGuest[], mode: ImportMode) {
  if (guests.length === 0) return { inserted: 0, updated: 0, duplicates: 0, linked: 0, removed: 0 };

  const supabase = createServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("guests")
    .select("id, first_name, last_name");
  if (existingError) throw existingError;

  type NameRow = { id: string; first_name: string; last_name: string | null };
  // Replace mode starts from a blank list. The old guests are only deleted at
  // the very end, so a failed import leaves the current list intact.
  const oldIds = mode === "replace" ? ((existing ?? []) as NameRow[]).map((g) => g.id) : [];
  const idByName = new Map<string, string>(
    mode === "replace" ? [] : ((existing ?? []) as NameRow[]).map((g) => [nameKey(g.first_name, g.last_name), g.id])
  );

  const fresh: ImportedGuest[] = [];
  const existingRows: Array<{ id: string; g: ImportedGuest }> = [];
  const seen = new Set<string>();
  let duplicates = 0;
  for (const g of guests) {
    const key = nameKey(g.first_name, g.last_name);
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    const existingId = idByName.get(key);
    if (existingId === undefined) fresh.push(g);
    else if (mode === "override") existingRows.push({ id: existingId, g });
    else duplicates += 1;
  }
  if (fresh.length === 0 && existingRows.length === 0) {
    return { inserted: 0, updated: 0, duplicates, linked: 0, removed: 0 };
  }

  // Override: write only the values the sheet actually has.
  for (const { id, g } of existingRows) {
    const patch = Object.fromEntries(
      Object.entries({
        title: g.title,
        email: g.email,
        phone: g.phone,
        notes: g.notes,
        tag: g.tag,
        last_emailed_at: g.last_emailed_at,
        plus_ones_allowed: g.plus_ones_allowed ?? (g.plus_one_names?.length || undefined),
      }).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(patch).length === 0) continue;
    const { error: updateError } = await supabase
      .from("guests")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) throw updateError;
  }

  const newIds: string[] = [];
  if (fresh.length) {
    const rows = fresh.map((g) => ({
      title: g.title,
      first_name: g.first_name,
      last_name: g.last_name,
      email: g.email,
      phone: g.phone,
      notes: g.notes,
      tag: g.tag,
      last_emailed_at: g.last_emailed_at,
      plus_ones_allowed: g.plus_ones_allowed ?? g.plus_one_names?.length ?? 0,
    }));
    const { data: inserted, error } = await supabase.from("guests").insert(rows).select("id, first_name, last_name");
    if (error) throw error;
    for (const g of (inserted ?? []) as NameRow[]) {
      idByName.set(nameKey(g.first_name, g.last_name), g.id);
      newIds.push(g.id);
    }
  }

  // Plus-ones named in the "Plus Ones" cell become their own linked guests.
  const processed = [...fresh, ...existingRows.map((r) => r.g)];
  const plusOneRows: Array<{ first_name: string; last_name?: string; plus_one_of: string; tag?: string }> = [];
  for (const g of processed) {
    const hostId = idByName.get(nameKey(g.first_name, g.last_name));
    for (const name of g.plus_one_names ?? []) {
      const parts = splitName(name);
      if (idByName.has(nameKey(parts.first_name, parts.last_name)) || !hostId) continue;
      plusOneRows.push({ ...parts, plus_one_of: hostId, tag: g.tag });
    }
  }
  if (plusOneRows.length) {
    const { data: created, error: plusError } = await supabase
      .from("guests")
      .insert(plusOneRows)
      .select("id, first_name, last_name");
    if (plusError) throw plusError;
    for (const g of (created ?? []) as NameRow[]) {
      idByName.set(nameKey(g.first_name, g.last_name), g.id);
      newIds.push(g.id);
    }
  }

  // "Plus one of <name>" notes link the row to an existing or imported guest.
  let linked = plusOneRows.length;
  for (const g of processed) {
    if (!g.plus_one_of_name) continue;
    const hostId = idByName.get(g.plus_one_of_name.trim().toLowerCase().replace(/\s+/g, " "));
    const selfId = idByName.get(nameKey(g.first_name, g.last_name));
    if (!hostId || !selfId || hostId === selfId) continue;
    const { error: linkError } = await supabase.from("guests").update({ plus_one_of: hostId }).eq("id", selfId);
    if (linkError) throw linkError;
    linked += 1;
  }

  const { data: events, error: eventsError } = await supabase.from("events").select("id");
  if (eventsError) throw eventsError;
  if (events?.length && newIds.length) {
    const rsvpRows = newIds.flatMap((guestId) =>
      events.map((event: { id: string }) => ({
        guest_id: guestId,
        event_id: event.id,
        status: "not_invited" as const,
      }))
    );
    const { error: rsvpError } = await supabase.from("guest_rsvps").insert(rsvpRows);
    if (rsvpError) throw rsvpError;
  }

  // Replace: now that the new list is safely in, remove the old one. RSVPs and
  // seat assignments go with them (cascade).
  // Deleted in small batches: one request carrying hundreds of ids can exceed
  // the maximum URL length and fail.
  for (let i = 0; i < oldIds.length; i += 40) {
    const { error: removeError } = await supabase.from("guests").delete().in("id", oldIds.slice(i, i + 40));
    if (removeError) throw removeError;
  }

  revalidatePath("/");
  revalidatePath("/guests");
  revalidatePath("/seating");
  return { inserted: newIds.length, updated: existingRows.length, duplicates, linked, removed: oldIds.length };
}

export type ImportResult =
  | { ok: true; inserted: number; updated: number; duplicates: number; linked: number; removed: number }
  | { ok: false; error: string };

// Server action errors are redacted in production, so failures are returned as
// data and the dialog can show the real reason (e.g. a missing migration).
export async function bulkCreateGuests(guests: ImportedGuest[], mode: ImportMode = "skip"): Promise<ImportResult> {
  try {
    return { ok: true, ...(await runBulkImport(guests, mode)) };
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as { message?: string } | null)?.message;
    return { ok: false, error: message || "Import failed" };
  }
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

// Marks every guest who is still "not invited" to an event as invited.
export async function inviteAllToEvent(eventId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("guest_rsvps")
    .update({ status: "invited", updated_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("status", "not_invited")
    .select("id");
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/guests");
  revalidatePath("/seating");
  return { invited: data?.length ?? 0 };
}

export async function markEmailed(guestId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("guests")
    .update({ last_emailed_at: new Date().toISOString() })
    .eq("id", guestId);
  if (error) throw error;
  revalidatePath("/guests");
}
