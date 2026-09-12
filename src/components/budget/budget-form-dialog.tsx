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
import { createBudgetItem, updateBudgetItem } from "@/app/actions/budget";
import type { BudgetItem, WeddingEvent } from "@/lib/supabase/types";
import { Pencil, Plus } from "lucide-react";

export function BudgetFormDialog({
  events,
  item,
}: {
  events: WeddingEvent[];
  item?: BudgetItem;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!item;

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      const eventId = formData.get("event_id") as string;
      const input = {
        category: formData.get("category") as string,
        vendor_name: (formData.get("vendor_name") as string) || undefined,
        event_id: eventId === "none" ? null : eventId,
        estimated_cost: Number(formData.get("estimated_cost")) || 0,
        actual_cost: formData.get("actual_cost")
          ? Number(formData.get("actual_cost"))
          : undefined,
        amount_paid: Number(formData.get("amount_paid")) || 0,
        due_date: (formData.get("due_date") as string) || undefined,
        status: formData.get("status") as BudgetItem["status"],
        notes: (formData.get("notes") as string) || undefined,
      };
      if (isEdit) {
        await updateBudgetItem(item.id, input);
        toast.success("Budget item updated");
      } else {
        await createBudgetItem(input);
        toast.success("Budget item added");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save budget item");
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
          Add expense
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "Add expense"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="Catering, attire, flowers..."
                defaultValue={item?.category}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor_name">Vendor</Label>
              <Input id="vendor_name" name="vendor_name" defaultValue={item?.vendor_name ?? ""} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event_id">Linked event</Label>
            <Select name="event_id" defaultValue={item?.event_id ?? "none"}>
              <SelectTrigger id="event_id" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General / not event-specific</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="estimated_cost">Estimated (£)</Label>
              <Input
                id="estimated_cost"
                name="estimated_cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item?.estimated_cost ?? ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="actual_cost">Actual (£)</Label>
              <Input
                id="actual_cost"
                name="actual_cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item?.actual_cost ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount_paid">Paid (£)</Label>
              <Input
                id="amount_paid"
                name="amount_paid"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item?.amount_paid ?? ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={item?.due_date ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={item?.status ?? "planned"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={item?.notes ?? ""} rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
