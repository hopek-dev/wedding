"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { OpeningInvitation } from "@/components/site/opening-invitation";
import { jumpToTop } from "@/components/site/smooth-scroll";

// Moving between pages is instant: no fade, dissolve or cover. Next.js swaps the page the moment it is ready (the
// pages are fetched ahead of the click), and this only makes sure the new page starts at the top.
//
// Two small extras for a guest's own invitation, which is built just for them and so is slower to arrive:
//  - the RSVP link goes straight to their page when this browser has opened it before (no redirect trip);
//  - a small notice at the top says it is on its way, while the page stays as it is.
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openingTo, setOpeningTo] = useState<string | null>(null);
  const opening = openingTo !== null && pathname !== openingTo;

  // every new page starts at the top
  useEffect(() => {
    jumpToTop();
  }, [pathname]);

  useEffect(() => {
    if (!openingTo) return;
    const giveUp = window.setTimeout(() => setOpeningTo(null), 20000); // never leave the notice up for ever
    return () => window.clearTimeout(giveUp);
  }, [openingTo]);

  useEffect(() => {
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
      const toInvitation = url.pathname.startsWith("/rsvp/");
      setOpeningTo(toInvitation ? url.pathname : null);
      if (toInvitation && a.getAttribute("href") === "/rsvp") {
        e.preventDefault();
        e.stopPropagation();
        router.push(url.pathname + url.search + url.hash);
      }
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
