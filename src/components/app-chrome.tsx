"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";
import { BottomTabBar } from "@/components/bottom-tab-bar";

// Admin shell (nav + tab bar). The public RSVP pages are what guests see, so
// they render bare, without any of the planner's navigation.
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/rsvp/")) {
    return <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>;
  }
  return (
    <>
      <Nav />
      <main className={`mx-auto w-full ${pathname === "/seating" ? "max-w-[1520px]" : "max-w-5xl"} flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8`}>
        {children}
      </main>
      <BottomTabBar />
    </>
  );
}
