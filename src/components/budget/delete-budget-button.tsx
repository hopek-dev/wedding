"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteBudgetItem } from "@/app/actions/budget";
import { Trash2 } from "lucide-react";

export function DeleteBudgetButton({ itemId, category }: { itemId: string; category: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Remove "${category}" from the budget?`)) return;
    startTransition(async () => {
      try {
        await deleteBudgetItem(itemId);
        toast.success("Expense removed");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove expense");
      }
    });
  }

  return (
    <Button variant="ghost" size="icon" className="size-7" onClick={handleClick} disabled={isPending}>
      <Trash2 className="size-3.5 text-muted-foreground" />
    </Button>
  );
}
