// The couple's main wedding website (schedule, travel, places to stay, Q&A and
// the gift list live there). Override with NEXT_PUBLIC_WEDDING_SITE_URL.
export const WEDDING_SITE_URL = (
  process.env.NEXT_PUBLIC_WEDDING_SITE_URL?.trim() || "https://withjoy.com/vanessa-and-hope"
).replace(/\/$/, "");

// Short form for printing on the invitation, e.g. "withjoy.com/vanessa-and-hope".
export const WEDDING_SITE_LABEL = WEDDING_SITE_URL.replace(/^https?:\/\//, "");
