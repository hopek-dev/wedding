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
import { updateTask } from "@/app/actions/tasks";
import type { TaskStatus } from "@/lib/supabase/types";

const statusStyles: Record<TaskStatus, string> = {
  todo: "text-muted-foreground",
  in_progress: "text-status-info",
  done: "text-status-good",
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export function TaskStatusCell({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      try {
        await updateTask(taskId, { status: value as TaskStatus });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update task");
      }
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" className={`w-[130px] border-none shadow-none ${statusStyles[status]}`}>
        <SelectValue>{statusLabels[status]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todo">Not started</SelectItem>
        <SelectItem value="in_progress">In progress</SelectItem>
        <SelectItem value="done">Done</SelectItem>
      </SelectContent>
    </Select>
  );
}
