"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateGuest } from "@/app/actions/guests";
import type { AgeGroup } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

// Adult or child, in one click. A child is priced at the child rate (and an adult at the adult rate) on every
// per-guest expense on the Budget page, so this is what drives the pricing.
export function AgeBadge({ guestId, ageGroup }: { guestId: string; ageGroup: AgeGroup }) {
  const router = useRouter();
  const [current, setCurrent] = useState<AgeGroup>(ageGroup);
  const [pending, start] = useTransition();
  const next: AgeGroup = current === "child" ? "adult" : "child";

  function toggle() {
    const before = current;
    setCurrent(next);
    start(async () => {
      try {
        await updateGuest(guestId, { age_group: next });
        router.refresh();
      } catch (err) {
        setCurrent(before);
        const message = err instanceof Error ? err.message : "";
        toast.error(/age_group/i.test(message) ? "Run migration 0014 in Supabase first, then try again." : message || "Couldn't change that guest.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={`${current === "child" ? "Child" : "Adult"}: click to change to ${next}`}
      className={cn(
        "mt-1 mr-1 inline-flex h-5 items-center rounded-full border px-2 text-xs font-normal transition-colors",
        current === "child" ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
        pending && "opacity-60"
      )}
    >
      {current === "child" ? "Child" : "Adult"}
    </button>
  );
}
