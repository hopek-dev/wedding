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
import { formatGBP } from "@/lib/format";
import { ALL_GUESTS, NO_EVENT_GUESTS, perGuestBreakdown, type EventGuests } from "@/lib/budget";
import type { BudgetCostType, BudgetItem, WeddingEvent } from "@/lib/supabase/types";
import { Pencil, Plus } from "lucide-react";

export function BudgetFormDialog({
  events,
  categories,
  guestCounts,
  item,
}: {
  events: WeddingEvent[];
  categories: string[];
  guestCounts: Record<string, EventGuests>;
  item?: BudgetItem;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [costType, setCostType] = useState<BudgetCostType>(item?.cost_type ?? "flat");
  const [eventId, setEventId] = useState(item?.event_id ?? "none");
  const [perGuestCost, setPerGuestCost] = useState(item?.per_guest_cost?.toString() ?? "");
  const [teenCost, setTeenCost] = useState(item?.teen_cost != null ? String(item.teen_cost) : "");
  const [childCost, setChildCost] = useState(item?.child_cost != null ? String(item.child_cost) : "");
  const [minGuests, setMinGuests] = useState(item?.min_guests != null ? String(item.min_guests) : "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const isEdit = !!item;

  const isPerGuest = costType === "per_guest";
  // linked to an event: that event's guests; not linked: everyone on the guest list. The estimate is for everyone invited,
  // the actual (so far) for the guests who have accepted.
  const counts = guestCounts[eventId !== "none" ? eventId : ALL_GUESTS] ?? NO_EVENT_GUESTS;
  const rates = {
    per_guest_cost: Number(perGuestCost) || 0,
    teen_cost: teenCost.trim() !== "" ? Number(teenCost) || 0 : null,
    child_cost: childCost.trim() !== "" ? Number(childCost) || 0 : null,
    min_guests: Number(minGuests) > 0 ? Number(minGuests) : null,
  };
  const preview = perGuestBreakdown(rates, counts.invited);
  const actualSoFar = perGuestBreakdown(rates, counts.accepted);
  const eventName = events.find((e) => e.id === eventId)?.name;
  const eventLabel = (v: string) => (v === "none" ? "General / not event-specific" : (events.find((e) => e.id === v)?.name ?? ""));
  const costTypeLabel = (v: BudgetCostType) => (v === "per_guest" ? "Per guest attending the event" : "Flat amount");
  const statusLabelMap: Record<BudgetItem["status"], string> = { planned: "Planned", booked: "Booked", paid: "Paid" };

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      const teenCostNum = teenCost.trim() !== "" ? Number(teenCost) || 0 : null;
      const childCostNum = childCost.trim() !== "" ? Number(childCost) || 0 : null;
      const minGuestsNum = Number(minGuests) > 0 ? Math.round(Number(minGuests)) : null;
      const input = {
        category,
        vendor_name: (formData.get("vendor_name") as string) || undefined,
        event_id: eventId === "none" ? null : eventId,
        cost_type: costType,
        per_guest_cost: isPerGuest ? Number(perGuestCost) || 0 : null,
        // the child rate and the minimum are only sent when there is something to set or to clear (see createBudgetItem)
        ...(isPerGuest && teenCostNum != null ? { teen_cost: teenCostNum } : item?.teen_cost != null ? { teen_cost: null } : {}),
        ...(isPerGuest && childCostNum != null ? { child_cost: childCostNum } : item?.child_cost != null ? { child_cost: null } : {}),
        ...(isPerGuest && minGuestsNum != null ? { min_guests: minGuestsNum } : item?.min_guests != null ? { min_guests: null } : {}),
        estimated_cost: isPerGuest ? preview.total : Number(formData.get("estimated_cost")) || 0,
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
              {isNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    id="category"
                    autoFocus
                    placeholder="e.g. Catering"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsNewCategory(false);
                      setCategory(item?.category ?? categories[0] ?? "");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select
                  value={category}
                  onValueChange={(v) => {
                    if (v === "__new__") {
                      setIsNewCategory(true);
                      setCategory("");
                    } else if (v) {
                      setCategory(v);
                    }
                  }}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue>{category || "Select a category"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">+ Add new category</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor_name">Vendor</Label>
              <Input id="vendor_name" name="vendor_name" defaultValue={item?.vendor_name ?? ""} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event_id">Linked event</Label>
            <Select value={eventId} onValueChange={(v) => v && setEventId(v)}>
              <SelectTrigger id="event_id" className="w-full">
                <SelectValue>{eventLabel(eventId)}</SelectValue>
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

          <div className="grid gap-2">
            <Label htmlFor="cost_type">How is this priced?</Label>
            <Select value={costType} onValueChange={(v) => v && setCostType(v as BudgetCostType)}>
              <SelectTrigger id="cost_type" className="w-full">
                <SelectValue>{costTypeLabel(costType)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat amount</SelectItem>
                <SelectItem value="per_guest">Per guest attending the event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isPerGuest ? (
            <div key="per_guest_cost" className="grid gap-3 rounded-lg border bg-muted/40 p-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="per_guest_cost">Adult (£ each)</Label>
                  <Input id="per_guest_cost" type="number" min="0" step="0.01" value={perGuestCost} onChange={(e) => setPerGuestCost(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="teen_cost">Teen (£ each)</Label>
                  <Input id="teen_cost" type="number" min="0" step="0.01" value={teenCost} onChange={(e) => setTeenCost(e.target.value)} placeholder="Same as adult" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="child_cost">Child (£ each)</Label>
                  <Input id="child_cost" type="number" min="0" step="0.01" value={childCost} onChange={(e) => setChildCost(e.target.value)} placeholder="Same as adult" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="min_guests">Minimum number of guests</Label>
                <Input id="min_guests" type="number" min="0" step="1" value={minGuests} onChange={(e) => setMinGuests(e.target.value)} placeholder="No minimum" />
                <p className="text-xs text-muted-foreground">
                  If the supplier charges for a minimum number of guests, enter it. With fewer guests than that, the missing places are charged at the adult rate.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {
                  <>
                    {preview.adults} adult{preview.adults === 1 ? "" : "s"} × {formatGBP(preview.adultRate)}
                    {preview.teens > 0 && (
                      <>
                        {" "}
                        + {preview.teens} teen{preview.teens === 1 ? "" : "s"} × {formatGBP(preview.teenRate)}
                      </>
                    )}
                    {preview.children > 0 && (
                      <>
                        {" "}
                        + {preview.children} child{preview.children === 1 ? "" : "ren"} × {formatGBP(preview.childRate)}
                      </>
                    )}
                    {preview.shortfall > 0 && (
                      <>
                        {" "}
                        + {preview.shortfall} to reach the minimum of {preview.minimum} × {formatGBP(preview.adultRate)}
                      </>
                    )}{" "}
                    = <strong>{formatGBP(preview.total)}</strong> estimated, for all {counts.invited.total} guests invited{eventId === "none" ? "" : ` to ${eventName}`}. The actual so far is{" "}
                    <strong>{formatGBP(actualSoFar.total)}</strong>, for the {counts.accepted.total} who have accepted{actualSoFar.shortfall > 0 ? ` plus ${actualSoFar.shortfall} places to reach the minimum` : ""}. Both update as guests reply or move between adult, teen and child.
                  </>
                }
              </p>
            </div>
          ) : (
            <div key="estimated_cost" className="grid gap-2">
              <Label htmlFor="estimated_cost">Estimated (£)</Label>
              <Input
                id="estimated_cost"
                name="estimated_cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item?.cost_type === "flat" ? item?.estimated_cost : ""}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {isPerGuest ? (
              <div className="grid content-start gap-2">
                <Label>Actual</Label>
                <p className="text-xs text-muted-foreground">Worked out from the guests who have accepted.</p>
              </div>
            ) : (
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
            )}
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
                  <SelectValue>{(v: BudgetItem["status"]) => statusLabelMap[v]}</SelectValue>
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
