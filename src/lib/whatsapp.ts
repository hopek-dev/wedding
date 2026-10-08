import { WEDDING_SITE_URL } from "@/lib/site";

// Helpers for sending RSVP links over WhatsApp using click-to-chat (wa.me)
// links. These open WhatsApp with the message pre-filled; the sender taps Send.

export const DEFAULT_COUNTRY_CODE = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "44";

// Turns a phone number as typed in a spreadsheet into WhatsApp's format
// (country code + number, digits only). Returns null if it can't be a real number.
export function normalizePhone(raw: string | null | undefined, countryCode = DEFAULT_COUNTRY_CODE): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (trimmed.startsWith("+")) {
    // Already international, but "+44 (0)7700..." has a stray trunk zero.
    if (/^\+\s*\d{1,3}\s*\(0\)/.test(trimmed)) digits = digits.replace(/^(\d{1,3})0/, "$1");
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = countryCode + digits.slice(1);
  } else if (digits.length <= 10) {
    digits = countryCode + digits;
  }
  return digits.length >= 9 && digits.length <= 15 ? digits : null;
}

export function formatPhone(digits: string) {
  return `+${digits}`;
}

export function whatsappLink(digits: string, message: string) {
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// Where the Invitations page saves the sender's edited messages (per browser).
export const TEMPLATE_KEY = "hitched.invite-templates.v1";

export function savedInviteTemplate() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEMPLATE_KEY) ?? "null");
    if (saved?.invite) return saved.invite as string;
  } catch {}
  return DEFAULT_INVITE_TEMPLATE;
}

export const DEFAULT_INVITE_TEMPLATE =
  "Dear {first_name},\n\n💌 *Vanessa & Hope* request the pleasure of your company at their wedding celebrations.\n\nYour personal invitation is waiting for you. Tap to open it and let us know if you can join us:\n{link}\n\nKindly reply by {deadline}.\n\nThe schedule, travel, places to stay and our gift list are all on our wedding website:\n{website}\n\nWith love,\nVanessa & Hope";

export const DEFAULT_REMINDER_TEMPLATE =
  "Dear {first_name},\n\nA gentle nudge from *Vanessa & Hope*: we haven't had your RSVP yet. It only takes a minute:\n{link}\n\nKindly reply by {deadline}.\n\nThank you!";

export function renderTemplate(
  template: string,
  vars: { first_name: string; full_name: string; link: string; deadline?: string; website?: string }
) {
  // With no deadline set, any line mentioning it is dropped instead of
  // reading "reply by the RSVP deadline".
  const lines = vars.deadline ? template.split("\n") : template.split("\n").filter((l) => !l.includes("{deadline}"));
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replaceAll("{first_name}", vars.first_name)
    .replaceAll("{full_name}", vars.full_name)
    .replaceAll("{link}", vars.link)
    .replaceAll("{deadline}", vars.deadline ?? "")
    .replaceAll("{website}", vars.website ?? WEDDING_SITE_URL);
}

// The address RSVP links point at. Prefer the configured public URL; otherwise
// use wherever the app is being viewed from (which only works for guests once deployed).
export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return typeof window === "undefined" ? "" : window.location.origin;
}

export function isLocalOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.)/.test(origin);
}

export function rsvpUrl(token: string) {
  return `${siteOrigin()}/rsvp/${token}`;
}
