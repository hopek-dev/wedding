export interface ImportedGuest {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

type Field = "first_name" | "last_name" | "full_name" | "email" | "phone" | "notes";

const ALIASES: Record<Field, string[]> = {
  first_name: ["first name", "firstname", "given name"],
  last_name: ["last name", "lastname", "surname", "family name"],
  full_name: ["full name", "name", "guest name", "guest"],
  email: ["email", "email address", "e mail"],
  phone: ["phone", "phone number", "mobile", "mobile number", "tel", "telephone"],
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

export function parseGuestRows(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return { guests: [] as ImportedGuest[], skipped: 0, matchedName: false };

  const headers = Object.keys(rows[0]);
  const map = buildHeaderMap(headers);
  const hasNameColumn = !!map.first_name || !!map.full_name;
  const guests: ImportedGuest[] = [];
  let skipped = 0;

  for (const row of rows) {
    let firstName = cell(row, map.first_name);
    let lastName = cell(row, map.last_name);

    if (!firstName && map.full_name) {
      const full = cell(row, map.full_name);
      const [first, ...rest] = full.split(" ").filter(Boolean);
      firstName = first ?? "";
      lastName = lastName || rest.join(" ");
    }

    if (!firstName) {
      skipped += 1;
      continue;
    }

    guests.push({
      first_name: firstName,
      last_name: lastName || undefined,
      email: cell(row, map.email) || undefined,
      phone: cell(row, map.phone) || undefined,
      notes: cell(row, map.notes) || undefined,
    });
  }

  return { guests, skipped, matchedName: hasNameColumn };
}
