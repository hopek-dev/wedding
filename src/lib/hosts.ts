// The two web addresses this one app answers on. The main wedding website (and RSVP) is the public
// address; the planner (password protected) is the planner address. Both are served by the same
// deployment, and src/proxy.ts decides what each one shows. Override with
// NEXT_PUBLIC_PUBLIC_HOST / NEXT_PUBLIC_PLANNER_HOST if the domains ever change.
//
// On any other address (localhost, a Vercel preview) everything works from the one address, as before.

const clean = (v: string | undefined, fallback: string) => (v?.trim() || fallback).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

export const PUBLIC_HOST = clean(process.env.NEXT_PUBLIC_PUBLIC_HOST, "www.vanessahopehitched.uk");
export const PLANNER_HOST = clean(process.env.NEXT_PUBLIC_PLANNER_HOST, "planner.vanessahopehitched.uk");
// "vanessahopehitched.uk" without the www. It is sent on to the www address.
export const APEX_HOST = PUBLIC_HOST.replace(/^www\./, "");

export const PUBLIC_ORIGIN = `https://${PUBLIC_HOST}`;
export const PLANNER_ORIGIN = `https://${PLANNER_HOST}`;

export type HostKind = "public" | "planner" | "other";

// `host` may include a port (localhost:3000) or be a full Host header value.
export function hostKind(host: string | null | undefined): HostKind {
  const h = (host ?? "").toLowerCase().split(":")[0];
  if (h === PUBLIC_HOST || h === APEX_HOST) return "public";
  if (h === PLANNER_HOST) return "planner";
  return "other";
}
