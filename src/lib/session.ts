// Session tokens for the planner login. Uses Web Crypto only, so it runs in the
// proxy as well as in server code. A token is "<expiry-ms>.<hmac>"; the HMAC is
// keyed with SESSION_SECRET (or, if that isn't set, ADMIN_PASSWORD), so a
// token can't be forged or extended without the secret.

export const SESSION_COOKIE = "hitched_session";
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

// Login is switched on by setting ADMIN_PASSWORD. Without it nobody can sign
// in, so everything stays locked (it never fails open).
export function authConfigured() {
  return !!process.env.ADMIN_PASSWORD;
}

async function hmacHex(message: string, key: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Compares without bailing at the first difference.
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken() {
  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return `${expiry}.${await hmacHex(`session:${expiry}`, secret())}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token || !authConfigured()) return false;
  const [expiry, signature] = token.split(".");
  if (!expiry || !signature || !(Number(expiry) > Date.now())) return false;
  return safeEqual(signature, await hmacHex(`session:${expiry}`, secret()));
}

export async function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Hash both so the comparison is the same length whatever was typed.
  const [a, b] = await Promise.all([hmacHex(input, "password-check"), hmacHex(expected, "password-check")]);
  return safeEqual(a, b);
}
