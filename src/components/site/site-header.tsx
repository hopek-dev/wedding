"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV, WEDDING } from "@/lib/site-content";
import { cn } from "@/lib/utils";

// The wedding website header, as on the Joy site: the couple's names in script, then the
// links with the current page underlined.
//  - Phones: the links live behind a menu button that opens a list of large tap targets.
//  - Tablets and up: the links sit in a row. After you scroll a little the big names fade
//    away and only the slim menu bar stays, so it doesn't hold a quarter of an iPad's screen.
// The header is fixed to the top and a spacer of its full height holds its place in the page,
// so shrinking it never makes the content jump.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SiteHeader() {
  const pathname = usePathname();
  const current = pathname === "/" ? "/welcome" : pathname;
  const [open, setOpen] = useState(false);
  const [slim, setSlim] = useState(false);
  const [fullHeight, setFullHeight] = useState<number | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const slimRef = useRef(false);
  useEffect(() => {
    slimRef.current = slim;
  }, [slim]);

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
    const onScroll = () => setSlim(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Measure the header at its full size (never while slimmed; the phone menu sits outside the bar).
  useIsoLayoutEffect(() => {
    const el = bar.current;
    if (!el) return;
    const measure = () => {
      if (slimRef.current) return;
      const pad = parseFloat(getComputedStyle(el.parentElement as HTMLElement).paddingTop) || 0;
      setFullHeight(Math.ceil(el.getBoundingClientRect().height + pad + 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      {/* holds the header's place in the page; its height is measured, with a close default for the first paint */}
      <div aria-hidden className="h-[4.1rem] md:h-[11.8rem]" style={fullHeight ? { height: fullHeight } : undefined} />

      {open && (
        <button type="button" data-lenis-prevent aria-label="Close menu" tabIndex={-1} className="fixed inset-0 z-30 bg-foreground/30 md:hidden" onClick={() => setOpen(false)} />
      )}
      <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/95 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div ref={bar} className="relative px-4 pt-3 pb-2 text-center md:pt-9 md:pb-3">
          <Link
            href="/welcome"
            className={cn(
              "font-cursive block overflow-hidden whitespace-nowrap text-[2.6rem] leading-tight text-muted-foreground transition-all duration-300 md:text-6xl lg:text-7xl",
              slim && "md:max-h-0 md:opacity-0"
            )}
            aria-hidden={slim ? true : undefined}
            tabIndex={slim ? -1 : undefined}
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
            className="absolute top-1/2 right-2 grid size-12 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors active:bg-secondary md:hidden"
          >
            {open ? <X className="size-6" strokeWidth={1.5} /> : <Menu className="size-6" strokeWidth={1.5} />}
          </button>

          <nav className={cn("mt-4 hidden transition-[margin] duration-300 md:block", slim && "md:!-mt-2")} aria-label="Wedding website">
            <ul className="mx-auto flex items-center justify-center gap-5 text-[13px] font-light tracking-wide text-muted-foreground lg:gap-9 lg:text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className={cn(
                      "block border-b border-transparent py-1.5 whitespace-nowrap transition-colors hover:border-muted-foreground hover:text-foreground pointer-coarse:py-3.5",
                      current === n.href && "border-muted-foreground text-foreground"
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
