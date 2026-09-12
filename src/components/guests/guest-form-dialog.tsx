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
import { guestFullName, type Guest } from "@/lib/supabase/types";
import { Pencil, Plus } from "lucide-react";

export function GuestFormDialog({ guests, guest }: { guests: Guest[]; guest?: Guest }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!guest;

  // A guest can't be their own plus-one, and (to avoid chains) can't be
  // linked to a guest who is themselves already a plus-one of someone else.
  const plusOneOptions = guests.filter((g) => g.id !== guest?.id && !g.plus_one_of);
  const plusOneLabel = (v: string) => {
    if (v === "none") return "Not a plus-one";
    const linked = guests.find((g) => g.id === v);
    return linked ? guestFullName(linked) : "";
  };

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      const plusOneOf = formData.get("plus_one_of") as string;
      const input = {
        first_name: formData.get("first_name") as string,
        last_name: (formData.get("last_name") as string) || undefined,
        email: (formData.get("email") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        plus_one_of: plusOneOf === "none" ? null : plusOneOf,
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                name="first_name"
                defaultValue={guest?.first_name}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" name="last_name" defaultValue={guest?.last_name ?? ""} />
            </div>
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
            <Label htmlFor="plus_one_of">Plus one of</Label>
            <Select name="plus_one_of" defaultValue={guest?.plus_one_of ?? "none"}>
              <SelectTrigger id="plus_one_of" className="w-full">
                <SelectValue>{(v: string) => plusOneLabel(v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not a plus-one</SelectItem>
                {plusOneOptions.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {guestFullName(g)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
