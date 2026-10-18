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
import { AlertTriangle } from "lucide-react";
import { BudgetFormDialog } from "@/components/budget/budget-form-dialog";
import { DeleteBudgetButton } from "@/components/budget/delete-budget-button";
import { formatGBP, formatDate } from "@/lib/format";
import { budgetCategoryOptions, guestCountsByEvent, guestListCount, perGuestBreakdown, resolvedEstimatedCost } from "@/lib/budget";
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

  // The budget in terms of guests: who it is for, what part depends on the number of guests, and where a supplier's
  // minimum means paying for guests who aren't there.
  const everyone = guestListCount(guests);
  const isPerGuestItem = (i: BudgetItem) => i.cost_type === "per_guest" && !!i.event_id && i.per_guest_cost != null;
  const perGuestTotal = items.filter(isPerGuestItem).reduce((sum, i) => sum + resolvedEstimatedCost(i, guestCounts), 0);
  const fixedTotal = totalEstimated - perGuestTotal;
  const minimums = items
    .filter(isPerGuestItem)
    .map((item) => ({ item, b: perGuestBreakdown(item, guestCounts[item.event_id!] ?? { adults: 0, children: 0 }) }))
    .filter(({ b }) => b.shortfall > 0);

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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Budget for {everyone.total} guest{everyone.total === 1 ? "" : "s"}
            <span className="font-normal text-muted-foreground">
              {" "}
              ({everyone.adults} adult{everyone.adults === 1 ? "" : "s"}
              {everyone.children > 0 ? `, ${everyone.children} child${everyone.children === 1 ? "" : "ren"}` : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">Total estimated</div>
              <div className="text-lg font-semibold">{formatGBP(totalEstimated)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Per guest</div>
              <div className="text-lg font-semibold">{formatGBP(everyone.total > 0 ? totalEstimated / everyone.total : 0)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Depends on guest numbers</div>
              <div className="text-lg font-semibold">{formatGBP(perGuestTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Fixed costs</div>
              <div className="text-lg font-semibold">{formatGBP(fixedTotal)}</div>
            </div>
          </div>
          {events.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {events.map((e) => {
                const c = guestCounts[e.id];
                return (
                  <Badge key={e.id} variant="outline" className="h-auto px-2.5 py-1 font-normal whitespace-normal">
                    {e.name}: <strong className="ml-1 font-medium">{c?.total ?? 0}</strong>
                    <span className="ml-1 text-muted-foreground">
                      ({c?.adults ?? 0} adult{c?.adults === 1 ? "" : "s"}
                      {c?.children ? `, ${c.children} child${c.children === 1 ? "" : "ren"}` : ""})
                    </span>
                  </Badge>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Guests are counted unless they have declined that event. Mark a guest as an adult or a child on the Guests page; per-guest costs
            use the adult or child rate, and any minimum number of guests, set on each expense.
          </p>
        </CardContent>
      </Card>

      {minimums.length > 0 && (
        <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="grid gap-1">
            <strong>
              {minimums.length} expense{minimums.length === 1 ? " is" : "s are"} charging for a minimum number of guests ({formatGBP(minimums.reduce((a, m) => a + m.b.shortfallCost, 0))} for places that aren&apos;t filled).
            </strong>
            {minimums.map(({ item, b }) => (
              <span key={item.id}>
                {item.category}
                {item.vendor_name ? ` (${item.vendor_name})` : ""}: minimum {b.minimum}, you have {b.adults + b.children}. {b.shortfall} empty place{b.shortfall === 1 ? "" : "s"} × {formatGBP(b.adultRate)} = {formatGBP(b.shortfallCost)}.
              </span>
            ))}
          </div>
        </div>
      )}

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
              const split = isPerGuest ? perGuestBreakdown(item, guestCounts[item.event_id!] ?? { adults: 0, children: 0 }) : null;
              return (
                <TableRow key={item.id}>
                  <TableCell data-span="full" className="font-medium">{item.category}</TableCell>
                  <TableCell data-label="Vendor" className="text-muted-foreground">{item.vendor_name}</TableCell>
                  <TableCell data-label="Event" className="text-muted-foreground">
                    {item.event_id ? eventNameById.get(item.event_id) : "General"}
                  </TableCell>
                  <TableCell data-label="Estimated">
                    <div>{formatGBP(estimated)}</div>
                    {split && (
                      <div className="text-xs text-muted-foreground">
                        <div>
                          {split.adults} adult{split.adults === 1 ? "" : "s"} × {formatGBP(split.adultRate)}
                        </div>
                        {split.children > 0 && (
                          <div>
                            {split.children} child{split.children === 1 ? "" : "ren"} × {formatGBP(split.childRate)}
                          </div>
                        )}
                        {split.shortfall > 0 && (
                          <div className="text-amber-400">
                            + {split.shortfall} to reach the minimum of {split.minimum}
                          </div>
                        )}
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
