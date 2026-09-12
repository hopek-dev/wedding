"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertRsvp } from "@/app/actions/guests";
import type { RsvpStatus } from "@/lib/supabase/types";

const statusStyles: Record<RsvpStatus, string> = {
  not_invited: "text-muted-foreground",
  invited: "text-amber-600 dark:text-amber-400",
  confirmed: "text-emerald-600 dark:text-emerald-400",
  declined: "text-red-600 dark:text-red-400",
};

const statusLabels: Record<RsvpStatus, string> = {
  not_invited: "Not invited",
  invited: "Invited",
  confirmed: "Confirmed",
  declined: "Declined",
};

export function RsvpCell({
  guestId,
  eventId,
  status,
}: {
  guestId: string;
  eventId: string;
  status: RsvpStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      try {
        await upsertRsvp({ guest_id: guestId, event_id: eventId, status: value as RsvpStatus });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update RSVP");
      }
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" className={`w-[130px] border-none shadow-none ${statusStyles[status]}`}>
        <SelectValue>{statusLabels[status]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="not_invited">Not invited</SelectItem>
        <SelectItem value="invited">Invited</SelectItem>
        <SelectItem value="confirmed">Confirmed</SelectItem>
        <SelectItem value="declined">Declined</SelectItem>
      </SelectContent>
    </Select>
  );
}
