"use client";

import { useEffect } from "react";

// Remembers which invitation this browser opened, so the site's RSVP link
// takes the guest straight back to their own invitation.
export function RememberInvite({ token }: { token: string }) {
  useEffect(() => {
    document.cookie = `my-invite=${token}; path=/; max-age=31536000; SameSite=Lax`;
  }, [token]);
  return null;
}
