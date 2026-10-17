"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV, WEDDING } from "@/lib/site-content";
import { cn } from "@/lib/utils";

// The wedding website header. Every page opens with a full-screen photograph, and the header floats
// on top of it: white lettering, no bar. Once you scroll it turns into a solid cream bar so the links
// stay readable over the rest of the page.
//  - Phones: the links live behind a menu button that opens a list of large tap targets.
//  - Tablets and up: the links sit in a row. When the bar turns solid the big names fade away and only
//    the slim menu stays, so it doesn't hold a quarter of an iPad's screen.
const SOLID_AFTER = 60;

export function SiteHeader() {
  const pathname = usePathname();
  const current = pathname === "/" ? "/welcome" : pathname.startsWith("/rsvp") ? "/rsvp" : pathname;
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  // the menu closes whenever the page changes (page-transition.tsx does the navigating, after a fade)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the phone menu, and the page behind doesn't scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > SOLID_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Over the photograph: white on a soft dark shade. Otherwise (scrolled, or the phone menu is open): solid cream.
  const light = !solid && !open;

  return (
    <>
      {open && (
        <button type="button" data-lenis-prevent aria-label="Close menu" tabIndex={-1} className="fixed inset-0 z-30 bg-foreground/30 md:hidden" onClick={() => setOpen(false)} />
      )}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500",
          light ? "bg-transparent" : "bg-background/95 shadow-[0_1px_0_0_rgba(70,62,30,0.12)] backdrop-blur-md"
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* a soft shade behind the white lettering, gone once the bar is solid */}
        <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-black/55 to-transparent transition-opacity duration-500", light ? "opacity-100" : "opacity-0")} />

        <div className="relative px-4 pt-3 pb-2 text-center md:pt-8 md:pb-3">
          <Link
            href="/welcome"
            className={cn(
              "font-cursive block overflow-hidden whitespace-nowrap text-[2.6rem] leading-tight transition-all duration-500 md:text-6xl lg:text-7xl",
              light ? "text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.35)]" : "text-muted-foreground",
              solid && "md:max-h-0 md:opacity-0"
            )}
            aria-hidden={solid ? true : undefined}
            tabIndex={solid ? -1 : undefined}
            onClick={() => setOpen(false)}
          >
            {WEDDING.names}
          </Link>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "absolute top-1/2 right-2 grid size-12 -translate-y-1/2 place-items-center rounded-full transition-colors md:hidden",
              light ? "text-white" : "text-muted-foreground active:bg-secondary"
            )}
          >
            {open ? <X className="size-6" strokeWidth={1.5} /> : <Menu className="size-6" strokeWidth={1.5} />}
          </button>

          <nav className={cn("mt-4 hidden transition-[margin] duration-500 md:block", solid && "md:!-mt-2")} aria-label="Wedding website">
            <ul className="mx-auto flex items-center justify-center gap-5 text-[13px] font-light tracking-[0.06em] lg:gap-9 lg:text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className={cn(
                      "block border-b border-transparent py-1.5 whitespace-nowrap transition-colors pointer-coarse:py-3.5",
                      light
                        ? "text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)] hover:border-white/80 hover:text-white"
                        : "text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                      current === n.href && (light ? "border-white text-white" : "border-muted-foreground text-foreground")
                    )}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Phone menu: a full-width list under the header, with a dimmed page behind it. */}
        {open && (
          <div className="md:hidden">
            <nav id="site-menu" aria-label="Wedding website" className="border-t bg-background pb-[env(safe-area-inset-bottom)]">
              <ul className="divide-y">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      aria-current={current === n.href ? "page" : undefined}
                      className={cn(
                        "flex min-h-[3.5rem] items-center justify-center px-6 text-lg font-light tracking-[0.08em] text-muted-foreground active:bg-secondary",
                        current === n.href && "bg-secondary/60 text-foreground"
                      )}
                      style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.3rem" }}
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
