// The couple's main wedding website (schedule, travel, places to stay, Q&A and
// the gift list live there). Override with NEXT_PUBLIC_WEDDING_SITE_URL.
export const WEDDING_SITE_URL = (
  process.env.NEXT_PUBLIC_WEDDING_SITE_URL?.trim() || "https://withjoy.com/vanessa-and-hope"
).replace(/\/$/, "");

// The couple's full names as printed on the invitation card.
export const COUPLE_FULL_NAMES = ["Vanessa L Haughton", "Hope K Tettey"] as const;

// Small pencil sketch of the venue at the top of the invitation: a transparent
// PNG made with scripts/venue-sketch.py. Replace the file to change it.
export const VENUE_SKETCH_URL = "/couple/venue-sketch.png";
