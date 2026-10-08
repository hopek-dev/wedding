"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reorderEvents } from "@/app/actions/events";

// Moves one event a step earlier or later. The order set here is the order
// used everywhere: dashboard, Guests columns, seating tabs and RSVP page.
export function EventOrderButtons({ ids, index, name }: { ids: string[]; index: number; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function move(offset: -1 | 1) {
    const next = ids.slice();
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    start(async () => {
      const result = await reorderEvents(next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={pending || index === 0}
        onClick={() => move(-1)}
        title="Move earlier"
        aria-label={`Move ${name} earlier`}
      >
        <ArrowUp className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={pending || index === ids.length - 1}
        onClick={() => move(1)}
        title="Move later"
        aria-label={`Move ${name} later`}
      >
        <ArrowDown className="size-3.5" />
      </Button>
    </div>
  );
}
