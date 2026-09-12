"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTask } from "@/app/actions/tasks";
import { Trash2 } from "lucide-react";

export function DeleteTaskButton({ taskId, title }: { taskId: string; title: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Remove "${title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteTask(taskId);
        toast.success("Task removed");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove task");
      }
    });
  }

  return (
    <Button variant="ghost" size="icon" className="size-7" onClick={handleClick} disabled={isPending}>
      <Trash2 className="size-3.5 text-muted-foreground" />
    </Button>
  );
}
