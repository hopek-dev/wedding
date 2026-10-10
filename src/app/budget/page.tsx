import { listBudgetItems } from "@/app/actions/budget";
import { listEvents } from "@/app/actions/events";
import { listGuestsWithRsvps } from "@/app/actions/guests";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BudgetFormDialog } from "@/components/budget/budget-form-dialog";
import { DeleteBudgetButton } from "@/components/budget/delete-budget-button";
import { formatGBP, formatDate } from "@/lib/format";
import { budgetCategoryOptions, guestCountsByEvent, resolvedEstimatedCost } from "@/lib/budget";
import type { BudgetItem } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const statusVariant: Record<BudgetItem["status"], "secondary" | "default" | "outline"> = {
  planned: "outline",
  booked: "secondary",
  paid: "default",
};

export default async function BudgetPage() {
  const [items, events, { guests, rsvps }] = await Promise.all([
    listBudgetItems(),
    listEvents(),
    listGuestsWithRsvps(),
  ]);
  const eventNameById = new Map(events.map((e) => [e.id, e.name]));
  const guestCounts = guestCountsByEvent(events.map((e) => e.id), rsvps, guests);
  const categories = budgetCategoryOptions(items);

  const totalEstimated = items.reduce((sum, i) => sum + resolvedEstimatedCost(i, guestCounts), 0);
  const totalActual = items.reduce(
    (sum, i) => sum + Number(i.actual_cost ?? resolvedEstimatedCost(i, guestCounts)),
    0
  );
  const totalPaid = items.reduce((sum, i) => sum + Number(i.amount_paid), 0);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Budget</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} expense{items.length === 1 ? "" : "s"} tracked.
          </p>
        </div>
        <BudgetFormDialog events={events} categories={categories} guestCounts={guestCounts}/>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Estimated total</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold sm:text-2xl">{formatGBP(totalEstimated)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Actual / expected</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold sm:text-2xl">{formatGBP(totalActual)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Paid so far</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold sm:text-2xl">{formatGBP(totalPaid)}</CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table className="stack-table">
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Estimated</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const estimated = resolvedEstimatedCost(item, guestCounts);
              const isPerGuest = item.cost_type === "per_guest" && item.event_id;
              return (
                <TableRow key={item.id}>
                  <TableCell data-span="full" className="font-medium">{item.category}</TableCell>
                  <TableCell data-label="Vendor" className="text-muted-foreground">{item.vendor_name}</TableCell>
                  <TableCell data-label="Event" className="text-muted-foreground">
                    {item.event_id ? eventNameById.get(item.event_id) : "General"}
                  </TableCell>
                  <TableCell data-label="Estimated">
                    <div>{formatGBP(estimated)}</div>
                    {isPerGuest && (
                      <div className="text-xs text-muted-foreground">
                        {formatGBP(item.per_guest_cost)} × {guestCounts[item.event_id!] ?? 0} guests
                      </div>
                    )}
                  </TableCell>
                  <TableCell data-label="Actual">{item.actual_cost != null ? formatGBP(item.actual_cost) : "—"}</TableCell>
                  <TableCell data-label="Paid">{formatGBP(item.amount_paid)}</TableCell>
                  <TableCell data-label="Due" className="text-muted-foreground">{formatDate(item.due_date)}</TableCell>
                  <TableCell data-label="Status">
                    <Badge variant={statusVariant[item.status]} className="capitalize">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell data-span="full">
                    <div className="flex items-center gap-1">
                      <BudgetFormDialog events={events} categories={categories} guestCounts={guestCounts} item={item} />
                      <DeleteBudgetButton itemId={item.id} category={item.category} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No expenses tracked yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
