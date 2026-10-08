import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function isAdmin() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

// Call at the top of every server action that reads or changes planner data.
// The proxy only guards page routes; server actions can be called directly, so
// each one has to check for itself.
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in.");
}
