"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { jumpToTop } from "@/components/site/smooth-scroll";

// Smooth moves between pages of the wedding site. Clicking an internal link closes a cream curtain over
// the page (about a third of a second; the header stays above it), goes to the next page while it is
// hidden, back to the top, then lifts the curtain slowly as the new photograph settles into place.
// Stands aside for modified clicks, downloads, links that open elsewhere, and "reduced motion".
const CLOSE_MS = 380;

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const curtain = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);

  // the new page has arrived: lift the curtain
  useEffect(() => {
    leaving.current = false;
    const id = window.setTimeout(() => curtain.current?.classList.remove("is-on"), 60);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (url.pathname.startsWith("/calendar/")) return;
      e.preventDefault();
      if (leaving.current) return;
      e.stopPropagation(); // we do the navigation, after the curtain has closed
      leaving.current = true;
      curtain.current?.classList.add("is-on");
      window.setTimeout(() => {
        jumpToTop();
        router.push(url.pathname + url.search + url.hash);
        // if the page never changes (an error, a redirect back), don't leave the curtain down
        window.setTimeout(() => {
          if (leaving.current) {
            leaving.current = false;
            curtain.current?.classList.remove("is-on");
          }
        }, 5000);
      }, CLOSE_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return (
    <>
      <div ref={curtain} aria-hidden className="page-curtain" />
      <div key={pathname}>{children}</div>
    </>
  );
}
