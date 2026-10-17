import { OpeningInvitation } from "@/components/site/opening-invitation";

// Shown while the invitation streams in (see OpeningInvitation).
export default function LoadingInvitation() {
  return (
    <div className="grid min-h-[70svh] place-items-center px-6">
      <OpeningInvitation />
    </div>
  );
}
