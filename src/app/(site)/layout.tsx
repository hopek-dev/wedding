import type { Metadata } from "next";
import Link from "next/link";
import { GuestTheme } from "@/components/rsvp/guest-theme";
import { SiteHeader } from "@/components/site/site-header";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { pill } from "@/components/site/page-shell";
import { VENUE, WEDDING } from "@/lib/site-content";
import { eventDay } from "@/lib/public-site";
import "@/components/site/site.css";

export const metadata: Metadata = {
  title: { default: "Vanessa & Hope", template: "%s · Vanessa & Hope" },
  description: "Our wedding: schedule, travel, places to stay and more.",
  robots: { index: false, follow: false },
};

// Frame for every public wedding page. Always light and cream, like the Joy site,
// even though the planner itself is dark.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <GuestTheme />
      <SmoothScroll />
      <SiteHeader />
      {children}
      <footer className="mt-10 border-t bg-secondary/50 px-5 py-14 text-center">
        <p className="font-cursive text-5xl text-muted-foreground">{WEDDING.names}</p>
        <p className="mt-3 text-xs font-light tracking-[0.22em] text-muted-foreground uppercase">
          {eventDay(`${WEDDING.date}T12:00:00Z`)}
        </p>
        <p className="mt-1 text-xs font-light tracking-[0.22em] text-muted-foreground uppercase">{VENUE.name}</p>
        <Link href="/rsvp" className={`${pill} mt-8`}>
          RSVP
        </Link>
      </footer>
    </div>
  );
}
