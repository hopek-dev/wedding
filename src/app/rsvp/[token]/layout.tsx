import { SiteFrame } from "@/components/site/site-frame";

// A guest's personal RSVP page lives inside the same frame as the wedding website: same header and menu, so
// the website and the RSVP are one place, not two.
export default function PersonalRsvpLayout({ children }: { children: React.ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
