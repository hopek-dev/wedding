export function formatGBP(value: number | null | undefined) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function ordinal(n: number) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

// A date written the way people say it: "Monday, 15th March 2027". Pass the Intl options you want (the day is
// always given its st / nd / rd / th); weekday gets a comma after it.
export function formatOrdinalDate(date: Date, options: Intl.DateTimeFormatOptions, locale = "en-GB") {
  const parts = new Intl.DateTimeFormat(locale, { ...options, day: "numeric" }).formatToParts(date);
  return parts
    .map((p) => (p.type === "day" ? ordinal(Number(p.value)) : p.value))
    .join("")
    .replace(/^(\w+) (?=\d)/, options.weekday ? "$1, " : "$&");
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Date TBD";
  const d = new Date(value);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
  return `${formatOrdinalDate(d, { weekday: "short", month: "short", year: "numeric" })} ${time}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "TBD";
  return formatOrdinalDate(new Date(value), { month: "short", year: "numeric" });
}
