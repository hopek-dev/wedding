// The couple's main wedding website (schedule, travel, places to stay, Q&A and
// the gift list live there). Override with NEXT_PUBLIC_WEDDING_SITE_URL.
export const WEDDING_SITE_URL = (
  process.env.NEXT_PUBLIC_WEDDING_SITE_URL?.trim() || "https://withjoy.com/vanessa-and-hope"
).replace(/\/$/, "");

// The couple's full names as printed on the invitation card.
export const COUPLE_FULL_NAMES = ["Vanessa L Haughton", "Hope K Tettey"] as const;

// Watercolour-style painting of the venue at the top of the invitation, made with
// scripts/venue-watercolor.py (which also writes the -og.png copy used in the
// WhatsApp preview image). Replace the files to change it.
export const VENUE_ART_URL = "/couple/venue-watercolor.webp";
