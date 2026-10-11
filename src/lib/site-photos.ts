// Every photograph on the public wedding site is a "slot". Each slot has a picture that ships with the site
// (public/site/...), and the planner's Photos page can replace it, re-aim its crop and change its description.
// Slot ids are stored in the database (site_photos), so don't rename one once it has been used.

export type PhotoGroup = "Welcome page: rolling photos" | "Page headers (full screen)" | "Photos inside pages" | "Invitation (personal RSVP link and WhatsApp preview)";

export interface SlotDef {
  id: string;
  group: PhotoGroup;
  label: string;
  page: string; // where it appears, as a public path
  src: string; // the picture that ships with the site
  width: number;
  height: number;
  focus: { x: number; y: number }; // which part to keep when the photo is cropped, in percent
  alt: string;
}

const W = "Welcome page: rolling photos" as const;
const H = "Page headers (full screen)" as const;
const P = "Photos inside pages" as const;
const I = "Invitation (personal RSVP link and WhatsApp preview)" as const;

export const SLOTS: SlotDef[] = [
  { id: "welcome-1", group: W, label: "Rolling photo 1", page: "/welcome", src: "/site/blossom.webp", width: 1500, height: 1000, focus: { x: 50, y: 28 }, alt: "Vanessa and Hope among the blossom" },
  { id: "welcome-2", group: W, label: "Rolling photo 2", page: "/welcome", src: "/site/seaside.webp", width: 1500, height: 844, focus: { x: 45, y: 40 }, alt: "Vanessa and Hope by the sea" },
  { id: "welcome-3", group: W, label: "Rolling photo 3", page: "/welcome", src: "/site/lisbon.webp", width: 1448, height: 1086, focus: { x: 50, y: 35 }, alt: "Vanessa and Hope by a fountain in Lisbon" },
  { id: "welcome-4", group: W, label: "Rolling photo 4", page: "/welcome", src: "/site/engagement.webp", width: 2328, height: 1440, focus: { x: 58, y: 0 }, alt: "Vanessa and Hope, laughing, showing her engagement ring" },
  { id: "welcome-5", group: W, label: "Rolling photo 5", page: "/welcome", src: "/site/tower-bridge-wide.webp", width: 1448, height: 1086, focus: { x: 40, y: 10 }, alt: "Vanessa and Hope in front of Tower Bridge at night" },
  { id: "welcome-6", group: W, label: "Rolling photo 6", page: "/welcome", src: "/site/palms.webp", width: 1407, height: 1118, focus: { x: 50, y: 20 }, alt: "Vanessa and Hope laughing together on a palm-lined beach" },
  { id: "welcome-7", group: W, label: "Rolling photo 7", page: "/welcome", src: "/site/lake.webp", width: 1640, height: 959, focus: { x: 38, y: 30 }, alt: "Vanessa and Hope laughing by the lake" },

  { id: "hero-our-story", group: H, label: "Our Story", page: "/our-story", src: "/site/blossom.webp", width: 1500, height: 1000, focus: { x: 50, y: 28 }, alt: "Vanessa and Hope among the blossom" },
  { id: "hero-schedule", group: H, label: "Schedule", page: "/schedule", src: "/site/engagement.webp", width: 2328, height: 1440, focus: { x: 58, y: 0 }, alt: "Vanessa and Hope, laughing, showing her engagement ring" },
  { id: "hero-travel", group: H, label: "Travel", page: "/travel", src: "/site/venue.webp", width: 1000, height: 667, focus: { x: 50, y: 42 }, alt: "Mulberry House across the lake" },
  { id: "hero-our-london", group: H, label: "Our London", page: "/our-london", src: "/site/tower-bridge-wide.webp", width: 1448, height: 1086, focus: { x: 40, y: 10 }, alt: "Vanessa and Hope in front of Tower Bridge at night" },
  { id: "hero-places-to-stay", group: H, label: "Places to Stay", page: "/places-to-stay", src: "/site/venue.webp", width: 1000, height: 667, focus: { x: 50, y: 42 }, alt: "Mulberry House across the lake" },
  { id: "hero-qa", group: H, label: "Q & A", page: "/qa", src: "/site/palms.webp", width: 1407, height: 1118, focus: { x: 50, y: 30 }, alt: "Vanessa and Hope laughing together on a palm-lined beach" },
  { id: "hero-gift-list", group: H, label: "Gift List", page: "/gift-list", src: "/site/lake.webp", width: 1640, height: 959, focus: { x: 38, y: 40 }, alt: "Vanessa and Hope laughing by the lake" },
  { id: "hero-rsvp", group: H, label: "RSVP", page: "/rsvp", src: "/site/kiss.webp", width: 1536, height: 864, focus: { x: 50, y: 0 }, alt: "Hope kissing Vanessa on the cheek as she smiles" },

  { id: "story-band-1", group: P, label: "Our Story: first photo between the paragraphs", page: "/our-story", src: "/site/seaside.webp", width: 1500, height: 844, focus: { x: 30, y: 0 }, alt: "Vanessa and Hope by the sea" },
  { id: "story-band-2", group: P, label: "Our Story: second photo between the paragraphs", page: "/our-story", src: "/site/lisbon.webp", width: 1448, height: 1086, focus: { x: 50, y: 0 }, alt: "Vanessa and Hope by a fountain in Lisbon" },
  { id: "travel-band", group: P, label: "Travel: photo across the page", page: "/travel", src: "/site/seaside.webp", width: 1500, height: 844, focus: { x: 30, y: 0 }, alt: "Vanessa and Hope by the sea" },
  { id: "london-band", group: P, label: "Our London: photo across the page", page: "/our-london", src: "/site/bench.webp", width: 1448, height: 1086, focus: { x: 50, y: 0 }, alt: "Vanessa and Hope laughing together on a park bench" },
  { id: "schedule-photo-1", group: P, label: "Schedule: bottom photo, left", page: "/schedule", src: "/site/hands-crop.webp", width: 2160, height: 1440, focus: { x: 50, y: 0 }, alt: "Their hands together, with an engagement ring" },
  { id: "schedule-photo-2", group: P, label: "Schedule: bottom photo, right", page: "/schedule", src: "/site/cheers.webp", width: 2316, height: 1737, focus: { x: 50, y: 0 }, alt: "Vanessa and Hope raising a toast" },
  { id: "gift-honeymoon", group: P, label: "Gift List: honeymoon thumbnail", page: "/gift-list", src: "/site/honeymoon.webp", width: 1448, height: 1086, focus: { x: 50, y: 40 }, alt: "Vanessa and Hope on a boat in the sea" },

  { id: "invite-painting", group: I, label: "Invitation: the painting on the card (also in the WhatsApp preview)", page: "/rsvp/preview", src: "/couple/venue-watercolor.webp", width: 1000, height: 750, focus: { x: 50, y: 50 }, alt: "Watercolour painting of Mulberry House" },
  { id: "invite-photo", group: I, label: "Invitation: photo at the top of the RSVP page", page: "/rsvp/preview", src: "/couple/hero.jpg", width: 1536, height: 864, focus: { x: 50, y: 35 }, alt: "Vanessa and Hope" },
];

export const SLOT_BY_ID = new Map(SLOTS.map((s) => [s.id, s]));

// What is stored for a slot (any field may be empty: that means "use the shipped one").
export interface PhotoRow {
  slot: string;
  url: string | null;
  width: number | null;
  height: number | null;
  focus_x: number | null;
  focus_y: number | null;
  alt: string | null;
}

// A photo ready to draw: the picture, its shape, where to aim the crop, and its description.
export interface Photo {
  slot: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  ratio: number; // width / height
  focus: { x: number; y: number };
}

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

export function resolvePhoto(slot: string, rows: Record<string, PhotoRow> | undefined): Photo {
  const def = SLOT_BY_ID.get(slot);
  if (!def) throw new Error(`Unknown photo slot: ${slot}`);
  const row = rows?.[slot];
  const replaced = !!row?.url && !!row.width && !!row.height;
  const width = replaced ? row!.width! : def.width;
  const height = replaced ? row!.height! : def.height;
  return {
    slot,
    src: replaced ? row!.url! : def.src,
    alt: row?.alt?.trim() || def.alt,
    width,
    height,
    ratio: width / height,
    focus: {
      x: clamp(row?.focus_x ?? def.focus.x),
      y: clamp(row?.focus_y ?? def.focus.y),
    },
  };
}

export const objectPosition = (focus: { x: number; y: number }) => `${focus.x}% ${focus.y}%`;
