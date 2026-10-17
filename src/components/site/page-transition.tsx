"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { OpeningInvitation } from "@/components/site/opening-invitation";
import { jumpToTop } from "@/components/site/smooth-scroll";

// A quick crossfade between pages, with no cover and never an empty screen.
//
// In a browser that supports the View Transitions API (Chrome, Edge, Safari 18+, recent Firefox) clicking an
// internal link takes a picture of the current page, loads the next one underneath, and fades from the old picture
// to the new page. The two overlap the whole time. The header sits in its own layer and stays put (site.css).
// Browsers without it simply switch pages at once. Stands aside for modified clicks, downloads, links that open
// elsewhere, and "reduced motion".
//
// A guest's own invitation is built just for them and so is slower to arrive; there the page stays as it is, with a
// small notice at the top saying it is on its way, and the RSVP link goes straight to it when this browser has
// opened it before (no redirect trip).
const MAX_WAIT_MS = 2500;

// Kept outside the component on purpose. A guest's invitation lives in a different page frame from the rest of the
// site, so moving between them replaces this whole component with a new one; the new page's "I have arrived" has to
// reach the click handler that started the fade, or the fade waits out its time limit with the screen held still.
const state = { leaving: false, arrived: null as (() => void) | null };

type ViewTransitionDoc = Document & { startViewTransition?: (update: () => Promise<void> | void) => { finished: Promise<void>; ready?: Promise<void>; updateCallbackDone?: Promise<void> } };

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openingTo, setOpeningTo] = useState<string | null>(null);
  const opening = openingTo !== null && pathname !== openingTo;

  // the new page has arrived
  useEffect(() => {
    const wasLeaving = state.leaving;
    state.leaving = false;
    if (!state.arrived && wasLeaving) jumpToTop(); // a page that arrived after the fade had already ended
    if (state.arrived) {
      const done = state.arrived;
      state.arrived = null;
      // The browser holds painting while the old page is kept for the fade, so don't wait for a frame here: the new
      // page is already in the document, and this releases it to be captured.
      window.setTimeout(done, 0);
    } else {
      jumpToTop();
    }
  }, [pathname]);

  useEffect(() => {
    if (!openingTo) return;
    const giveUp = window.setTimeout(() => setOpeningTo(null), 20000); // never leave the notice up for ever
    return () => window.clearTimeout(giveUp);
  }, [openingTo]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as ViewTransitionDoc;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/calendar/")) return;
      if (url.pathname === "/rsvp") {
        const mine = document.cookie.match(/(?:^|; )my-invite=([a-f0-9]{8,64})(?:;|$)/i)?.[1];
        if (mine) url.pathname = `/rsvp/${mine}`;
      }
      if (url.pathname === location.pathname) return;
      const target = url.pathname + url.search + url.hash;
      const toInvitation = url.pathname.startsWith("/rsvp/");
      setOpeningTo(toInvitation ? url.pathname : null);

      // the newest click wins: if another page is still on its way, go where the visitor has just asked to go
      if (state.leaving) {
        e.preventDefault();
        e.stopPropagation();
        router.push(target);
        return;
      }
      // the guest's invitation: no fade (it can't show anything while it waits), just the notice
      if (toInvitation) {
        if (a.getAttribute("href") === "/rsvp") {
          e.preventDefault();
          e.stopPropagation();
          router.push(target);
        }
        return;
      }
      if (reduced || !doc.startViewTransition) return; // Next.js navigates on its own, at once

      e.preventDefault();
      e.stopPropagation(); // we do the navigation ourselves
      state.leaving = true;
      let transition: ReturnType<NonNullable<ViewTransitionDoc["startViewTransition"]>>;
      try {
        transition = doc.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              state.arrived = () => {
                jumpToTop();
                resolve();
              };
              router.push(target);
              // The browser gives up on a fade whose new page takes more than about 4 seconds. Let go well before
              // that: if the page still isn't here, the fade simply ends and the page appears when it is ready.
              window.setTimeout(() => {
                if (state.arrived) {
                  state.arrived = null;
                  resolve();
                }
              }, MAX_WAIT_MS);
            })
        );
      } catch {
        state.leaving = false;
        router.push(target);
        return;
      }
      // A fade that is skipped or cut short is normal (a fast second click, a slow page), not an error.
      const quiet = () => undefined;
      transition.ready?.catch(quiet);
      transition.updateCallbackDone?.catch(quiet);
      transition.finished.catch(quiet).finally(() => {
        // if the page never arrived (a very slow load), allow the next click
        window.setTimeout(() => {
          if (!state.arrived) state.leaving = false;
        }, 0);
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return (
    <>
      {opening && (
        <div className="fixed inset-x-0 top-24 z-[35] flex justify-center px-4 sm:top-28">
          <div className="rounded-full bg-foreground/90 px-5 py-2.5 text-background shadow-lg">
            <OpeningInvitation compact />
          </div>
        </div>
      )}
      <div key={pathname}>{children}</div>
    </>
  );
}
