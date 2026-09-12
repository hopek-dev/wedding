"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask, updateTask } from "@/app/actions/tasks";
import { TASK_CATEGORIES, type Task, type WeddingEvent } from "@/lib/supabase/types";
import { Pencil, Plus } from "lucide-react";

export function TaskFormDialog({
  events,
  task,
}: {
  events: WeddingEvent[];
  task?: Task;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!task;

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      const eventId = formData.get("event_id") as string;
      const input = {
        title: formData.get("title") as string,
        category: formData.get("category") as string,
        event_id: eventId === "none" ? null : eventId,
        start_date: (formData.get("start_date") as string) || undefined,
        due_date: (formData.get("due_date") as string) || undefined,
        status: formData.get("status") as Task["status"],
        priority: formData.get("priority") as Task["priority"],
        notes: (formData.get("notes") as string) || undefined,
      };
      if (isEdit) {
        await updateTask(task.id, input);
        toast.success("Task updated");
      } else {
        await createTask(input);
        toast.success("Task added");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
          <Pencil className="size-3.5" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="size-4" />
          Add task
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "Add task"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Buy the dress, book flights, confirm menu..."
              defaultValue={task?.title}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={task?.category ?? "General"}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event_id">Linked event</Label>
              <Select name="event_id" defaultValue={task?.event_id ?? "none"}>
                <SelectTrigger id="event_id" className="w-full">
                  <SelectValue>
                    {(v: string) => (v === "none" ? "None" : (events.find((e) => e.id === v)?.name ?? ""))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={task?.start_date ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={task?.due_date ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={task?.status ?? "todo"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue>
                    {(v: Task["status"]) =>
                      ({ todo: "Not started", in_progress: "In progress", done: "Done" })[v]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Not started</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue={task?.priority ?? "medium"}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue>
                    {(v: Task["priority"]) => ({ low: "Low", medium: "Medium", high: "High" })[v]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={task?.notes ?? ""} rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
