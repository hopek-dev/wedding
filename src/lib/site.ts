// The couple's main wedding website (schedule, travel, places to stay, Q&A and
// the gift list live there). Override with NEXT_PUBLIC_WEDDING_SITE_URL.
export const WEDDING_SITE_URL = (
  process.env.NEXT_PUBLIC_WEDDING_SITE_URL?.trim() || "https://withjoy.com/vanessa-and-hope"
).replace(/\/$/, "");

// Short form for printing on the invitation, e.g. "withjoy.com/vanessa-and-hope".
export const WEDDING_SITE_LABEL = WEDDING_SITE_URL.replace(/^https?:\/\//, "");

// The couple's full names as printed on the invitation card.
export const COUPLE_FULL_NAMES = ["Vanessa L Haughton", "Hope K Tettey"] as const;

// Photo cards shown under the invitation, in this order. Each is its own file
// in public/couple/; a card whose file isn't there is simply not shown, so add a
// photo by dropping the file in (and swap one by replacing it).
export const INVITE_PHOTOS = [
  { src: "/couple/card-1.jpg", alt: "Vanessa and Hope" },
  { src: "/couple/card-2.jpg", alt: "Pencil sketch of Mulberry House" },
] as const;
