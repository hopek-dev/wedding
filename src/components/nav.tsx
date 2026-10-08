"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/tasks", label: "Tasks" },
  { href: "/guests", label: "Guests" },
  { href: "/invitations", label: "Invites" },
  { href: "/seating", label: "Seating" },
  { href: "/budget", label: "Budget" },
];

// Mirrors the wedding website header: the couple's names in calligraphy, then
// a thin row of links with the current page underlined.
export function Nav() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="font-cursive text-4xl leading-none text-muted-foreground transition-transform active:scale-95 sm:text-5xl"
        >
          Vanessa &amp; Hope
        </Link>
        <nav className="hidden items-center gap-6 text-[13px] font-light tracking-wide sm:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "border-b border-transparent py-1 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                  active && "border-current text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
