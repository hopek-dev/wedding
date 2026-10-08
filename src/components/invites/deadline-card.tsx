"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { setRsvpDeadline } from "@/app/actions/settings";
import { daysUntil, formatDeadline } from "@/lib/rsvp-deadline";

// Sets the date after which guests can no longer change their RSVP. The date
// itself is still open for replies; the server enforces it, not just the form.
export function DeadlineCard({ deadline }: { deadline: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(deadline ?? "");
  const [pending, start] = useTransition();
  const dirty = value !== (deadline ?? "");

  const left = deadline ? daysUntil(deadline) : null;
  const status =
    deadline === null
      ? "No deadline set. Guests can change their answers at any time."
      : left! < 0
        ? `Closed on ${formatDeadline(deadline)}. Guests can see their answers but can't change them.`
        : left === 0
          ? `Closes tonight (${formatDeadline(deadline)}).`
          : `Open until the end of ${formatDeadline(deadline)} (${left} day${left === 1 ? "" : "s"} left).`;

  function save(next: string | null) {
    start(async () => {
      const result = await setRsvpDeadline(next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(next ? `Deadline set to ${formatDeadline(next)}` : "Deadline removed. RSVPs are open.");
      if (!next) setValue("");
      router.refresh();
    });
  }

  return (
    <Card size="sm">
      <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="size-4 text-muted-foreground" />
            RSVP deadline
          </div>
          <p className={left !== null && left < 0 ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{status}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-44"
            aria-label="RSVP deadline date"
          />
          <Button disabled={pending || !value || !dirty} onClick={() => save(value)}>
            Save
          </Button>
          {deadline && (
            <Button variant="ghost" disabled={pending} onClick={() => save(null)}>
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
