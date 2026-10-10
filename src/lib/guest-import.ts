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
  // Known plus-ones (from the "Plus 1 First/Last Name" columns, or names typed
  // in the "Plus Ones" cell). Each becomes a guest linked to this one.
  plus_one_people?: Array<{ first_name: string; last_name?: string }>;
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
  | "plus_ones"
  | "plus1_first"
  | "plus1_last";

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
  plus1_first: ["plus 1 first name", "plus one first name", "plus1 first name", "plus 1 firstname", "partner first name", "guest first name"],
  plus1_last: ["plus 1 last name", "plus one last name", "plus1 last name", "plus 1 lastname", "partner last name", "guest last name", "plus 1 surname"],
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

function toPerson(full: string) {
  const [first, ...rest] = full.split(/\s+/).filter(Boolean);
  return { first_name: first ?? full, last_name: rest.join(" ") || undefined };
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

    // A plus-one is "known" when the sheet names them, either in the two Plus 1
    // columns or as text in the Plus Ones cell. A bare number means a plus-one
    // is allowed but not named yet (the guest adds them on their RSVP).
    const people: Array<{ first_name: string; last_name?: string }> = [];
    const p1First = cell(row, map.plus1_first);
    if (p1First) people.push({ first_name: p1First, last_name: cell(row, map.plus1_last) || undefined });
    if (plusOnesRaw && plusOnesNumber === undefined) people.push(...splitNames(plusOnesRaw).map(toPerson));

    guests.push({
      title: cell(row, map.title) || undefined,
      first_name: firstName,
      last_name: lastName || undefined,
      email: cell(row, map.email) || undefined,
      phone: cell(row, map.phone) || undefined,
      notes: notes || undefined,
      tag: cell(row, map.tag) || undefined,
      last_emailed_at: toIsoDate(cell(row, map.last_emailed)),
      plus_ones_allowed: plusOnesNumber ?? (people.length || undefined),
      plus_one_people: people.length ? people : undefined,
      plus_one_of_name: plusOneOf,
    });
  }

  return { guests, skipped, matchedName: hasNameColumn };
}
