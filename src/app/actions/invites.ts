"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

// Records that a guest's RSVP link was sent (e.g. via WhatsApp).
export async function markInviteSent(guestId: string, channel: "whatsapp" | "email" | "manual") {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("guests")
    .update({ invite_sent_at: new Date().toISOString(), invite_channel: channel })
    .eq("id", guestId);
  if (error) throw error;
  revalidatePath("/guests");
  revalidatePath("/invitations");
}
