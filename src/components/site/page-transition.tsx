"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { OpeningInvitation } from "@/components/site/opening-invitation";
import { jumpToTop } from "@/components/site/smooth-scroll";

// Smooth moves between pages of the wedding site.
//
// In a browser that supports the View Transitions API (Chrome, Edge, Safari 18+, recent Firefox) clicking an
// internal link takes a picture of the current page, loads the next one underneath, and dissolves from the old
// picture to the new page. The two overlap the whole time, so there is never an empty screen to flash.
// The header sits in its own layer and stays put (site.css).
//
// In a browser without it, the page fades out and the next one fades in, as a fallback.
//
// Stands aside for modified clicks, downloads, links that open elsewhere, and "reduced motion".
const FADE_OUT_MS = 270;
const MAX_WAIT_MS = 2500;

type ViewTransitionDoc = Document & { startViewTransition?: (update: () => Promise<void> | void) => { finished: Promise<void>; ready?: Promise<void>; updateCallbackDone?: Promise<void> } };

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const arrived = useRef<(() => void) | null>(null);
  // The guest's own invitation is slow to build, so the moment they ask for it we say that it is coming (the
  // dissolve can't show anything while it waits, which is why this page change skips it).
  const [openingTo, setOpeningTo] = useState<string | null>(null);
  const opening = openingTo !== null && pathname !== openingTo;
  useEffect(() => {
    if (!openingTo) return;
    const giveUp = window.setTimeout(() => setOpeningTo(null), 20000); // never leave the message up for ever
    return () => window.clearTimeout(giveUp);
  }, [openingTo]);

  // the new page has arrived
  useEffect(() => {
    const wasLeaving = leaving.current;
    leaving.current = false;
    if (!arrived.current && wasLeaving) jumpToTop(); // a slow page that arrived after the dissolve had already ended
    if (arrived.current) {
      const done = arrived.current;
      arrived.current = null;
      // The browser freezes painting while the old page is held for the dissolve, so don't wait for a frame here:
      // the new page is already in the document, and this releases it to be captured.
      window.setTimeout(done, 0);
    }
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const doc = document as ViewTransitionDoc;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (url.pathname.startsWith("/calendar/")) return;
      e.preventDefault();
      e.stopPropagation(); // we do the navigation ourselves
      // A guest who has opened their invitation before goes straight to it: the RSVP link would otherwise go to
      // /rsvp and be redirected, an extra trip. (src/proxy.ts does the same for a link opened in a new tab.)
      if (url.pathname === "/rsvp") {
        const mine = document.cookie.match(/(?:^|; )my-invite=([a-f0-9]{8,64})(?:;|$)/i)?.[1];
        if (mine) url.pathname = `/rsvp/${mine}`;
      }
      const target = url.pathname + url.search + url.hash;
      if (url.pathname === location.pathname) return; // already on the guest's invitation
      // Another page is still on its way: go where the visitor has just asked to go instead of ignoring the click
      // (the newest click wins), so moving on never has to wait for the page before it.
      if (leaving.current) {
        setOpeningTo(url.pathname.startsWith("/rsvp/") ? url.pathname : null);
        router.push(target);
        return;
      }
      leaving.current = true;
      if (url.pathname.startsWith("/rsvp/")) {
        setOpeningTo(url.pathname);
        router.push(target);
        return;
      }
      setOpeningTo(null);

      if (doc.startViewTransition) {
        let transition: ReturnType<NonNullable<ViewTransitionDoc["startViewTransition"]>>;
        try {
          transition = doc.startViewTransition(
            () =>
              new Promise<void>((resolve) => {
                arrived.current = () => {
                  jumpToTop();
                  resolve();
                };
                router.push(target);
                // The browser gives up on a dissolve whose new page takes more than about 4 seconds, which can
                // happen when a page is slow to load. Let go well before that: if the page still isn't here, the
                // dissolve simply ends and the page appears when it is ready.
                window.setTimeout(() => {
                  if (arrived.current) {
                    arrived.current = null;
                    resolve();
                  }
                }, MAX_WAIT_MS);
              })
          );
        } catch {
          leaving.current = false;
          router.push(target);
          return;
        }
        // A dissolve that is skipped or cut short is normal (a fast second click, a slow page), not an error:
        // swallow it so it never shows up as an unhandled failure.
        const quiet = () => undefined;
        const t = transition as unknown as { ready?: Promise<void>; updateCallbackDone?: Promise<void>; finished: Promise<void> };
        t.ready?.catch(quiet);
        t.updateCallbackDone?.catch(quiet);
        t.finished.catch(quiet).finally(() => {
          // if the page never arrived (a very slow load), allow the next click
          window.setTimeout(() => {
            if (!arrived.current) leaving.current = false;
          }, 0);
        });
        return;
      }

      // fallback: fade out, go, fade in
      box.current?.classList.add("page-leaving");
      router.prefetch(url.pathname + url.search);
      window.setTimeout(() => {
        jumpToTop();
        router.push(target);
        window.setTimeout(() => {
          if (leaving.current) {
            leaving.current = false;
            box.current?.classList.remove("page-leaving");
          }
        }, 5000);
      }, FADE_OUT_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return (
    <>
      <div ref={box} key={pathname} className="page-arrive">
        {children}
      </div>
      {opening && (
        <div className="fixed inset-0 z-[35] grid place-items-center bg-background px-6" style={{ animation: "hero-fade 0.2s ease both" }}>
          <OpeningInvitation />
        </div>
      )}
    </>
  );
}
