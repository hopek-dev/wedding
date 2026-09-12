"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Landmark, ListTodo, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: Landmark },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/budget", label: "Budget", icon: Wallet },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 backdrop-blur-md supports-backdrop-filter:bg-card/75 sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-5xl items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-transform active:scale-90",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("size-5", active && "fill-primary/15")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
