import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Everything needs the planner login except what guests use: their RSVP pages
// (and the invitation images), the couple photos, and the app icons.
// This only redirects page visits. Server actions check the session themselves
// (requireAdmin), because they can be called without going through a page.
const PUBLIC = [/^\/login$/, /^\/rsvp\//, /^\/couple\//, /^\/icon/, /^\/apple-icon/, /^\/manifest\.webmanifest$/];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC.some((pattern) => pattern.test(pathname))) return NextResponse.next();
  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
