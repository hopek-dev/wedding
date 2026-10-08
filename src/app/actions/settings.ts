"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { DEADLINE_PATTERN } from "@/lib/rsvp-deadline";
import { requireAdmin } from "@/lib/require-admin";

const DEADLINE_KEY = "rsvp_deadline";

// Returns the RSVP deadline (YYYY-MM-DD) or null when none is set. If the
// settings table doesn't exist yet (migration not run) this reads as "no
// deadline" so guest RSVPs keep working.
export async function getRsvpDeadline(): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", DEADLINE_KEY).maybeSingle();
  if (error || !data?.value || !DEADLINE_PATTERN.test(data.value)) return null;
  return data.value as string;
}

export type SaveDeadlineResult = { ok: true } | { ok: false; error: string };

// Pass null to remove the deadline and keep RSVPs open.
export async function setRsvpDeadline(deadline: string | null): Promise<SaveDeadlineResult> {
  await requireAdmin();
  if (deadline !== null && !DEADLINE_PATTERN.test(deadline)) return { ok: false, error: "Choose a valid date." };
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: DEADLINE_KEY, value: deadline, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/invitations");
  return { ok: true };
}
