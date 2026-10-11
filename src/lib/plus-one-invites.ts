import type { SupabaseClient } from "@supabase/supabase-js";

// A plus-one who is linked to a guest is invited to the same events as that guest. Linking someone as a
// plus-one (adding them, editing them, importing a list) used to leave them "not invited" to everything, so
// the RSVP page showed answer buttons for the guest only. This invites any linked plus-one who isn't invited
// to anything yet to the events their host is invited to.
//
// Only people who are not invited to ANY event are touched, so a plus-one whose events were set by hand
// (say, evening party only) is never changed. Pass plusOneIds to look at just those people, or nothing to
// check everyone. Returns how many plus-ones were brought up to date.
export async function syncPlusOneInvites(supabase: SupabaseClient, plusOneIds?: string[]): Promise<number> {
  let query = supabase.from("guests").select("id, plus_one_of").not("plus_one_of", "is", null);
  if (plusOneIds) {
    if (plusOneIds.length === 0) return 0;
    query = query.in("id", plusOneIds);
  }
  const { data: kids, error } = await query;
  if (error) throw error;
  if (!kids?.length) return 0;

  type Row = { id: string; guest_id: string; event_id: string; status: string };
  const ids = [...new Set(kids.flatMap((k: { id: string; plus_one_of: string }) => [k.id, k.plus_one_of]))];
  const rows: Row[] = [];
  for (let i = 0; i < ids.length; i += 40) {
    const { data, error: rowsError } = await supabase.from("guest_rsvps").select("id, guest_id, event_id, status").in("guest_id", ids.slice(i, i + 40));
    if (rowsError) throw rowsError;
    rows.push(...((data ?? []) as Row[]));
  }
  const byGuest = new Map<string, Row[]>();
  for (const r of rows) byGuest.set(r.guest_id, [...(byGuest.get(r.guest_id) ?? []), r]);

  const toInvite: string[] = []; // existing rows to flip to "invited"
  const toCreate: Array<{ guest_id: string; event_id: string; status: "invited" }> = [];
  let fixed = 0;
  for (const kid of kids as Array<{ id: string; plus_one_of: string }>) {
    const mine = byGuest.get(kid.id) ?? [];
    if (mine.some((r) => r.status !== "not_invited")) continue; // already has events of their own
    const hostEvents = (byGuest.get(kid.plus_one_of) ?? []).filter((r) => r.status !== "not_invited").map((r) => r.event_id);
    if (hostEvents.length === 0) continue;
    for (const eventId of hostEvents) {
      const existing = mine.find((r) => r.event_id === eventId);
      if (existing) toInvite.push(existing.id);
      else toCreate.push({ guest_id: kid.id, event_id: eventId, status: "invited" });
    }
    fixed++;
  }
  for (let i = 0; i < toInvite.length; i += 40) {
    const { error: updateError } = await supabase.from("guest_rsvps").update({ status: "invited", updated_at: new Date().toISOString() }).in("id", toInvite.slice(i, i + 40));
    if (updateError) throw updateError;
  }
  if (toCreate.length) {
    const { error: insertError } = await supabase.from("guest_rsvps").insert(toCreate);
    if (insertError) throw insertError;
  }
  return fixed;
}
