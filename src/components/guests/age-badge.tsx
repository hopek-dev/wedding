"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateGuest } from "@/app/actions/guests";
import type { AgeGroup } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const LABELS: Record<AgeGroup, string> = { adult: "Adult", teen: "Teen", child: "Child" };

// Adult, teen or child, chosen in place. Each group has its own rate on every per-guest expense on the Budget page, so
// this is what drives the pricing.
export function AgeBadge({ guestId, ageGroup }: { guestId: string; ageGroup: AgeGroup }) {
  const router = useRouter();
  const [current, setCurrent] = useState<AgeGroup>(ageGroup);
  const [pending, start] = useTransition();

  function change(next: AgeGroup) {
    const before = current;
    setCurrent(next);
    start(async () => {
      try {
        await updateGuest(guestId, { age_group: next });
        router.refresh();
      } catch (err) {
        setCurrent(before);
        const message = err instanceof Error ? err.message : "";
        toast.error(/age_group/i.test(message) ? "Run migrations 0014 and 0015 in Supabase first, then try again." : message || "Couldn't change that guest.");
      }
    });
  }

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => change(e.target.value as AgeGroup)}
      aria-label="Adult, teen or child"
      className={cn(
        "mt-1 mr-1 h-5 cursor-pointer appearance-none rounded-full border bg-transparent px-2 text-xs font-normal transition-colors",
        current === "adult" ? "text-muted-foreground hover:bg-secondary" : "border-primary bg-primary text-primary-foreground",
        pending && "opacity-60"
      )}
    >
      {(Object.keys(LABELS) as AgeGroup[]).map((g) => (
        <option key={g} value={g} className="bg-card text-foreground">
          {LABELS[g]}
        </option>
      ))}
    </select>
  );
}
