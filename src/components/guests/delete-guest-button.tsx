"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteGuest } from "@/app/actions/guests";
import { Trash2 } from "lucide-react";

export function DeleteGuestButton({ guestId, guestName }: { guestId: string; guestName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Remove ${guestName} from the guest list?`)) return;
    startTransition(async () => {
      try {
        await deleteGuest(guestId);
        toast.success(`${guestName} removed`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove guest");
      }
    });
  }

  return (
    <Button variant="ghost" size="icon" className="size-7" onClick={handleClick} disabled={isPending}>
      <Trash2 className="size-3.5 text-muted-foreground" />
    </Button>
  );
}
