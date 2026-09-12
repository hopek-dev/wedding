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
import { createGuest, updateGuest } from "@/app/actions/guests";
import type { Guest } from "@/lib/supabase/types";
import { Pencil, Plus } from "lucide-react";

export function GuestFormDialog({ guest }: { guest?: Guest }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!guest;

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      const input = {
        full_name: formData.get("full_name") as string,
        email: (formData.get("email") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        side: formData.get("side") as Guest["side"],
        plus_one_allowed: formData.get("plus_one_allowed") === "on",
        plus_one_name: (formData.get("plus_one_name") as string) || undefined,
        notes: (formData.get("notes") as string) || undefined,
      };
      if (isEdit) {
        await updateGuest(guest.id, input);
        toast.success("Guest updated");
      } else {
        await createGuest(input);
        toast.success("Guest added");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save guest");
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
          Add guest
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit guest" : "Add guest"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={guest?.full_name}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={guest?.email ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={guest?.phone ?? ""} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="side">Side</Label>
            <Select name="side" defaultValue={guest?.side ?? "both"}>
              <SelectTrigger id="side" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="partner_1">Partner 1</SelectItem>
                <SelectItem value="partner_2">Partner 2</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="plus_one_allowed"
              name="plus_one_allowed"
              type="checkbox"
              defaultChecked={guest?.plus_one_allowed}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="plus_one_allowed" className="font-normal">
              Plus-one allowed
            </Label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plus_one_name">Plus-one name (if known)</Label>
            <Input
              id="plus_one_name"
              name="plus_one_name"
              defaultValue={guest?.plus_one_name ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={guest?.notes ?? ""} rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add guest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
