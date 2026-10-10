import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { APEX_HOST, PLANNER_HOST, PUBLIC_HOST, hostKind } from "@/lib/hosts";

// One app, two addresses (see src/lib/hosts.ts):
//  - the public address (www.vanessahopehitched.uk) shows only what guests use: the wedding website,
//    RSVP pages, the gift list, photos and icons. Anything else is sent to the planner address.
//  - the planner address (planner.vanessahopehitched.uk) needs the planner login for everything
//    except the sign-in page and the shared assets. Wedding website pages are sent to the public address.
//  - on any other address (localhost, previews) both live together, as before.
// This only redirects page visits. Server actions check the session themselves (requireAdmin),
// because they can be called without going through a page.
const SITE = /^\/(welcome|our-story|schedule|travel|our-london|places-to-stay|qa|gift-list)$/;
const GUEST = [SITE, /^\/calendar\//, /^\/rsvp(\/|$)/, /^\/couple\//, /^\/site\//, /^\/icon/, /^\/apple-icon/, /^\/manifest\.webmanifest$/];
const SHARED = [...GUEST, /^\/login$/];

const matches = (list: RegExp[], path: string) => list.some((p) => p.test(path));

function toHost(request: NextRequest, hostname: string, status = 307) {
  const url = request.nextUrl.clone();
  url.hostname = hostname;
  return NextResponse.redirect(url, status);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const kind = hostKind(host);

  // ---- the main wedding website ----
  if (kind === "public") {
    if (host.toLowerCase().split(":")[0] === APEX_HOST && APEX_HOST !== PUBLIC_HOST) return toHost(request, PUBLIC_HOST, 308);
    if (pathname === "/") {
      const welcome = request.nextUrl.clone();
      welcome.pathname = "/welcome";
      return NextResponse.redirect(welcome);
    }
    if (matches(GUEST, pathname)) return NextResponse.next();
    // the planner (and its sign-in) live on their own address
    return toHost(request, PLANNER_HOST);
  }

  // ---- the planner ----
  if (kind === "planner") {
    // the planner doesn't show the wedding website; send those visitors to the public address
    if (SITE.test(pathname)) return toHost(request, PUBLIC_HOST);
    const res = await guard(request, pathname, search, false);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return guard(request, pathname, search, true);
}

// Everything needs the planner login except the shared pages. `welcomeAtRoot` sends signed-out visitors
// of the home address to the Welcome page (only where the planner and the website share one address).
async function guard(request: NextRequest, pathname: string, search: string, welcomeAtRoot: boolean) {
  if (matches(SHARED, pathname)) return NextResponse.next();
  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (pathname === "/" && welcomeAtRoot) {
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
