"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inviteAllToEvent } from "@/app/actions/guests";

export function InviteAllButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const { invited } = await inviteAllToEvent(eventId);
            toast.success(invited ? `Invited ${invited} guest${invited === 1 ? "" : "s"} to ${eventName}` : "Everyone is already invited");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to invite guests");
          }
        })
      }
      className="mt-0.5 block text-[11px] font-normal text-primary hover:underline disabled:opacity-50"
    >
      {pending ? "Inviting..." : "Invite all"}
    </button>
  );
}
