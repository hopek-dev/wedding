import type { GuestSide } from "@/lib/supabase/types";

export interface ImportedGuest {
  full_name: string;
  email?: string;
  phone?: string;
  side: GuestSide;
  plus_one_allowed: boolean;
  plus_one_name?: string;
  notes?: string;
}

type Field = "full_name" | "email" | "phone" | "side" | "plus_one_allowed" | "plus_one_name" | "notes";

const ALIASES: Record<Field, string[]> = {
  full_name: ["full name", "name", "guest name", "guest"],
  email: ["email", "email address", "e mail"],
  phone: ["phone", "phone number", "mobile", "mobile number", "tel", "telephone"],
  side: ["side", "partner", "whose guest", "which side"],
  plus_one_allowed: ["plus one allowed", "plus one", "plus 1", "has plus one", "allow plus one"],
  plus_one_name: ["plus one name", "plus 1 name", "guest of", "partner name"],
  notes: ["notes", "note", "comments", "dietary", "dietary requirements", "dietary notes"],
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildHeaderMap(headers: string[]) {
  const normalized = headers.map((h) => ({ original: h, normalized: normalizeHeader(h) }));
  const map: Partial<Record<Field, string>> = {};
  for (const field of Object.keys(ALIASES) as Field[]) {
    const match = normalized.find((h) => ALIASES[field].includes(h.normalized));
    if (match) map[field] = match.original;
  }
  return map;
}

function cell(row: Record<string, unknown>, key: string | undefined) {
  if (!key) return "";
  const value = row[key];
  return value == null ? "" : String(value).trim();
}

function truthy(value: string) {
  return ["y", "yes", "true", "1", "x"].includes(value.toLowerCase());
}

function parseSide(value: string): GuestSide {
  const s = value.toLowerCase();
  if (["1", "partner 1", "partner1", "p1"].includes(s)) return "partner_1";
  if (["2", "partner 2", "partner2", "p2"].includes(s)) return "partner_2";
  return "both";
}

export function parseGuestRows(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return { guests: [] as ImportedGuest[], skipped: 0, matchedName: false };

  const headers = Object.keys(rows[0]);
  const map = buildHeaderMap(headers);
  const guests: ImportedGuest[] = [];
  let skipped = 0;

  for (const row of rows) {
    const fullName = cell(row, map.full_name);
    if (!fullName) {
      skipped += 1;
      continue;
    }
    const plusOneName = cell(row, map.plus_one_name);
    guests.push({
      full_name: fullName,
      email: cell(row, map.email) || undefined,
      phone: cell(row, map.phone) || undefined,
      side: map.side ? parseSide(cell(row, map.side)) : "both",
      plus_one_allowed: (map.plus_one_allowed ? truthy(cell(row, map.plus_one_allowed)) : false) || !!plusOneName,
      plus_one_name: plusOneName || undefined,
      notes: cell(row, map.notes) || undefined,
    });
  }

  return { guests, skipped, matchedName: !!map.full_name };
}
