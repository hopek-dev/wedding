"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import type { Guest, GuestRsvp, WeddingEvent } from "@/lib/supabase/types";
import { getRsvpDeadline } from "@/app/actions/settings";
import { formatDeadline, isRsvpClosed } from "@/lib/rsvp-deadline";
import { requireAdmin } from "@/lib/require-admin";

export interface RsvpParty {
  guest: Guest;
  members: Guest[]; // the invitee plus any linked plus-ones
  events: WeddingEvent[]; // events at least one member is invited to
  rsvps: GuestRsvp[];
  openPlusOneSlots: number;
  deadline: string | null; // YYYY-MM-DD, null = no deadline
  closed: boolean; // deadline has passed: answers are read-only
}

// Looks up an invitation by its unguessable token. Returns null for an
// unknown token so the page can render a friendly "link not found" state.
export async function getRsvpParty(token: string): Promise<RsvpParty | null> {
  if (!/^[a-f0-9]{8,64}$/i.test(token)) return null;
  const supabase = createServiceClient();
  const { data: guest } = await supabase.from("guests").select("*").eq("rsvp_token", token).maybeSingle();
  if (!guest) return null;

  const { data: plusOnes } = await supabase.from("guests").select("*").eq("plus_one_of", guest.id);
  const members = [guest as Guest, ...((plusOnes ?? []) as Guest[])];
  const { data: rsvps } = await supabase
    .from("guest_rsvps")
    .select("*")
    .in("guest_id", members.map((m) => m.id));
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const invitedEventIds = new Set(
    ((rsvps ?? []) as GuestRsvp[]).filter((r) => r.status !== "not_invited").map((r) => r.event_id)
  );
  const deadline = await getRsvpDeadline();
  return {
    deadline,
    closed: isRsvpClosed(deadline),
    guest: guest as Guest,
    members,
    events: ((events ?? []) as WeddingEvent[]).filter((e) => invitedEventIds.has(e.id)),
    rsvps: (rsvps ?? []) as GuestRsvp[],
    openPlusOneSlots: Math.max(0, (guest as Guest).plus_ones_allowed - (plusOnes?.length ?? 0)),
  };
}

// A made-up invitation for the "Preview" link on the Invitations page, so the
// envelope and RSVP page can be seen exactly as a guest sees them without
// touching any real guest. Replies in preview mode are never saved.
// Options let the planner see both cases: a plus-one that is already known
// (?known=Gladys) and open slots the guest can fill in themselves (?open=1).
export async function getPreviewParty(
  firstName = "Alex",
  options: { knownPlusOne?: string; openSlots?: number } = {}
): Promise<RsvpParty> {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data: events } = await supabase.from("events").select("*").order("sort_order", { ascending: true });
  const deadline = await getRsvpDeadline();
  const now = new Date().toISOString();
  const guest = {
    id: "preview-guest",
    first_name: firstName,
    last_name: "Guest",
    email: null,
    phone: null,
    plus_one_of: null,
    title: null,
    tag: null,
    plus_ones_allowed: 0,
    last_emailed_at: null,
    rsvp_token: "preview",
    rsvp_responded_at: null,
    invite_sent_at: null,
    invite_channel: null,
    notes: null,
    created_at: now,
    updated_at: now,
  } satisfies Guest;
  const list = (events ?? []) as WeddingEvent[];
  const members: Guest[] = [guest];
  if (options.knownPlusOne) {
    members.push({ ...guest, id: "preview-plusone", first_name: options.knownPlusOne, plus_one_of: guest.id, rsvp_token: "preview-plusone" });
  }
  return {
    guest,
    members,
    events: list,
    rsvps: members.flatMap((m) =>
      list.map((e) => ({
        id: `preview-${m.id}-${e.id}`,
        guest_id: m.id,
        event_id: e.id,
        status: "invited" as const,
        headcount: 1,
        dietary_notes: null,
        updated_at: now,
      }))
    ),
    openPlusOneSlots: Math.max(0, Math.min(4, options.openSlots ?? 0)),
    deadline,
    closed: isRsvpClosed(deadline),
  };
}

// First name for personalising the page title and link preview.
export async function getInviteeFirstName(token: string): Promise<string | null> {
  if (!/^[a-f0-9]{8,64}$/i.test(token)) return null;
  const { data } = await createServiceClient().from("guests").select("first_name").eq("rsvp_token", token).maybeSingle();
  return (data?.first_name as string | undefined) ?? null;
}

export interface RsvpAnswer {
  guest_id: string;
  event_id: string;
  attending: boolean;
  dietary_notes?: string;
}

// Tidies a name typed on a phone: "tina" becomes "Tina", "TINA" becomes "Tina". Names with
// mixed capitals ("McDonald") and small connecting words ("de", "van") are left as typed.
const LOWER_WORDS = new Set(["de", "da", "di", "van", "von", "der", "den", "la", "le", "bin", "al"]);
function tidyName(raw: string) {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w, i) => {
      if (LOWER_WORDS.has(w.toLowerCase()) && i > 0) return w.toLowerCase();
      return w === w.toLowerCase() || w === w.toUpperCase() ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w;
    })
    .join(" ");
}

async function runSubmitRsvp(input: {
  token: string;
  answers: RsvpAnswer[];
  newPlusOnes?: Array<{ first_name: string; last_name?: string; dietary_notes?: string }>;
}) {
  const party = await getRsvpParty(input.token);
  if (!party) throw new Error("This RSVP link is no longer valid.");
  // Checked here, not just in the UI, so a stale page can't sneak a change in.
  if (party.closed && party.deadline) {
    throw new Error(`RSVPs closed on ${formatDeadline(party.deadline)}, so answers can no longer be changed.`);
  }
  const supabase = createServiceClient();

  // Plus-ones the guest names themselves (never more than their open slots)
  // become guests linked to them, invited to the same events, and attend
  // whatever the invitee attends.
  let members = party.members;
  let answers = input.answers;
  const added: Guest[] = [];
  const wanted = (input.newPlusOnes ?? [])
    .map((p) => ({ first_name: tidyName(p.first_name).slice(0, 60), last_name: p.last_name ? tidyName(p.last_name).slice(0, 60) : null, dietary: p.dietary_notes?.trim().slice(0, 500) || null }))
    .filter((p) => p.first_name)
    // never add someone who is already in this party (a double tap, or a second submit)
    .filter(
      (p, i, all) =>
        !party.members.some((m) => m.first_name.toLowerCase() === p.first_name.toLowerCase() && (m.last_name ?? "").toLowerCase() === (p.last_name ?? "").toLowerCase()) &&
        all.findIndex((q) => q.first_name.toLowerCase() === p.first_name.toLowerCase() && (q.last_name ?? "").toLowerCase() === (p.last_name ?? "").toLowerCase()) === i
    )
    .slice(0, party.openPlusOneSlots);
  if (wanted.length) {
    const { data: created, error } = await supabase
      .from("guests")
      .insert(wanted.map((p) => ({ first_name: p.first_name, last_name: p.last_name, plus_one_of: party.guest.id, tag: party.guest.tag })))
      .select("*");
    if (error) throw error;
    const { data: allEvents } = await supabase.from("events").select("id");
    const invitedTo = new Set(
      party.rsvps.filter((r) => r.guest_id === party.guest.id && r.status !== "not_invited").map((r) => r.event_id)
    );
    const newGuests = (created ?? []) as Guest[];
    const rows = newGuests.flatMap((g) =>
      (allEvents ?? []).map((e: { id: string }) => ({
        guest_id: g.id,
        event_id: e.id,
        status: invitedTo.has(e.id) ? "invited" : "not_invited",
      }))
    );
    if (rows.length) await supabase.from("guest_rsvps").insert(rows);
    for (const g of newGuests) {
      added.push(g);
      members = [...members, g];
      answers = [
        ...answers,
        ...input.answers
          .filter((a) => a.guest_id === party.guest.id)
          .map((a) => ({
            guest_id: g.id,
            event_id: a.event_id,
            attending: a.attending,
            // what the guest wrote for this plus-one when they named them
            dietary_notes: wanted.find((w) => w.first_name.toLowerCase() === g.first_name.toLowerCase() && (w.last_name ?? "").toLowerCase() === (g.last_name ?? "").toLowerCase())?.dietary ?? undefined,
          })),
      ];
    }
  }

  const memberIds = new Set(members.map((m) => m.id));
  const invited = new Set(
    (await supabase.from("guest_rsvps").select("guest_id, event_id, status").in("guest_id", [...memberIds])).data
      ?.filter((r: { status: string }) => r.status !== "not_invited")
      .map((r: { guest_id: string; event_id: string }) => `${r.guest_id}:${r.event_id}`) ?? []
  );

  // Only accept answers for people in this party and events they're invited to.
  const rows = answers
    .filter((a) => memberIds.has(a.guest_id) && invited.has(`${a.guest_id}:${a.event_id}`))
    .map((a) => ({
      guest_id: a.guest_id,
      event_id: a.event_id,
      status: a.attending ? "confirmed" : "declined",
      dietary_notes: a.dietary_notes?.slice(0, 500) || null,
      updated_at: new Date().toISOString(),
    }));
  if (rows.length === 0) throw new Error("Nothing to save.");

  const { error } = await supabase.from("guest_rsvps").upsert(rows, { onConflict: "guest_id,event_id" });
  if (error) throw error;
  await supabase.from("guests").update({ rsvp_responded_at: new Date().toISOString() }).eq("id", party.guest.id);

  revalidatePath("/");
  revalidatePath("/guests");
  revalidatePath("/seating");
  return { saved: rows.length, added };
}

export type SubmitRsvpResult = { ok: true; saved: number; added: Guest[] } | { ok: false; error: string };

// Failures come back as data: server action errors are redacted in
// production, and guests need to see why (e.g. the deadline has passed).
export async function submitRsvp(input: {
  token: string;
  answers: RsvpAnswer[];
  newPlusOnes?: Array<{ first_name: string; last_name?: string; dietary_notes?: string }>;
}): Promise<SubmitRsvpResult> {
  try {
    return { ok: true, ...(await runSubmitRsvp(input)) };
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as { message?: string } | null)?.message;
    return { ok: false, error: message || "Something went wrong. Please try again." };
  }
}
