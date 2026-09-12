"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/tasks", label: "Tasks" },
  { href: "/guests", label: "Guests" },
  { href: "/budget", label: "Budget" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header
      className="wedding-banner sticky top-0 z-40 border-b border-black/10 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.25)] relative"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent" />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 active:scale-95 transition-transform">
          <Heart className="size-5 fill-white/90 text-white drop-shadow-sm" />
          <span className="font-cursive text-3xl leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] sm:text-4xl">
            Haughton Tettey Hitched!
          </span>
        </Link>
        <nav className="-mx-1 hidden items-center gap-1 overflow-x-auto px-1 text-sm sm:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 whitespace-nowrap text-white/85 transition-colors hover:bg-white/15 hover:text-white",
                  active && "bg-white/25 font-medium text-white"
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
