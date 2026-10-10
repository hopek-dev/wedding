import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Everything needs the planner login except what guests use: the public wedding
// website, their RSVP pages (and the invitation images), the photos, and the app icons.
// Visitors who are not signed in and open the home address land on the Welcome page.
// This only redirects page visits. Server actions check the session themselves
// (requireAdmin), because they can be called without going through a page.
const SITE = /^\/(welcome|our-story|schedule|travel|our-london|places-to-stay|qa|gift-list)$/;
const PUBLIC = [SITE, /^\/calendar\//, /^\/login$/, /^\/rsvp(\/|$)/, /^\/couple\//, /^\/site\//, /^\/icon/, /^\/apple-icon/, /^\/manifest\.webmanifest$/];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC.some((pattern) => pattern.test(pathname))) return NextResponse.next();
  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (pathname === "/") {
    const welcome = request.nextUrl.clone();
    welcome.pathname = "/welcome";
    welcome.search = "";
    return NextResponse.redirect(welcome);
  }

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
