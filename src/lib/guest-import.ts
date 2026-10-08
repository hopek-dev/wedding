export interface ImportedGuest {
  title?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  tag?: string;
  last_emailed_at?: string;
  // Number of plus-ones this guest may bring (numeric "Plus Ones" cell).
  plus_ones_allowed?: number;
  // Names listed in the "Plus Ones" cell; each becomes a linked guest.
  plus_one_names?: string[];
  // Full name of the guest this row is a plus-one of, taken from notes such
  // as "Plus one of Franco Muzzio".
  plus_one_of_name?: string;
}

type Field =
  | "title"
  | "first_name"
  | "last_name"
  | "full_name"
  | "email"
  | "phone"
  | "notes"
  | "tag"
  | "last_emailed"
  | "plus_ones";

const ALIASES: Record<Field, string[]> = {
  title: ["title", "salutation"],
  first_name: ["first name", "firstname", "given name"],
  last_name: ["last name", "lastname", "surname", "family name"],
  full_name: ["full name", "name", "guest name", "guest"],
  email: ["email", "email optional", "email address", "e mail"],
  phone: ["phone", "phone number", "mobile", "mobile number", "tel", "telephone"],
  notes: ["notes", "note", "comments", "dietary", "dietary requirements", "dietary notes"],
  tag: ["tag", "tags", "group", "side", "category"],
  last_emailed: ["last email", "last emailed", "last email sent", "last contacted"],
  plus_ones: ["plus ones", "plus one", "plusones", "plus 1", "guests allowed"],
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
  if (value == null) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  return String(value).trim();
}

function toIsoDate(raw: string) {
  if (!raw) return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

const PLUS_ONE_OF = /plus[\s-]*one\s+of\s+(.+)/i;

function splitNames(raw: string) {
  return raw
    .split(/[,;\n/&]|\band\b/i)
    .map((n) => n.trim())
    .filter(Boolean);
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

    const notes = cell(row, map.notes);
    const plusOnesRaw = cell(row, map.plus_ones);
    const plusOnesNumber = /^\d+$/.test(plusOnesRaw) ? Number(plusOnesRaw) : undefined;
    const plusOneOf = notes.match(PLUS_ONE_OF)?.[1]?.trim();

    guests.push({
      title: cell(row, map.title) || undefined,
      first_name: firstName,
      last_name: lastName || undefined,
      email: cell(row, map.email) || undefined,
      phone: cell(row, map.phone) || undefined,
      notes: notes || undefined,
      tag: cell(row, map.tag) || undefined,
      last_emailed_at: toIsoDate(cell(row, map.last_emailed)),
      plus_ones_allowed: plusOnesNumber,
      plus_one_names: plusOnesRaw && plusOnesNumber === undefined ? splitNames(plusOnesRaw) : undefined,
      plus_one_of_name: plusOneOf,
    });
  }

  return { guests, skipped, matchedName: hasNameColumn };
}
