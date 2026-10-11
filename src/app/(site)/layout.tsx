import type { Metadata } from "next";
import { SiteFrame } from "@/components/site/site-frame";

export const metadata: Metadata = {
  title: { default: "Vanessa & Hope", template: "%s · Vanessa & Hope" },
  description: "Our wedding: schedule, travel, places to stay and more.",
  robots: { index: false, follow: false },
};

// Frame for every public wedding page (see SiteFrame).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
