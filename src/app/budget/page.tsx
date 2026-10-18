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
import { ALL_GUESTS, NO_EVENT_GUESTS, budgetCategoryOptions, costSplit, describeGuests, guestCountsByEvent, perGuestBreakdown, resolvedActualCost, resolvedEstimatedCost } from "@/lib/budget";
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

  // Estimated is priced for everyone invited; actual for the guests who have accepted (see src/lib/budget.ts).
  const totalEstimated = items.reduce((sum, i) => sum + resolvedEstimatedCost(i, guestCounts), 0);
  const totalActual = items.reduce((sum, i) => sum + resolvedActualCost(i, guestCounts), 0);
  const totalPaid = items.reduce((sum, i) => sum + Number(i.amount_paid), 0);

  // The budget in terms of guests: who it is for, what part is fixed (flat costs, and the value of any minimum number of
  // guests) and what depends on the number of guests, and where a supplier's minimum means paying for empty places.
  const everyone = guestCounts[ALL_GUESTS] ?? NO_EVENT_GUESTS;
  const isPerGuestItem = (i: BudgetItem) => i.cost_type === "per_guest" && i.per_guest_cost != null;
  const split = items.reduce(
    (t, i) => {
      const c = costSplit(i, guestCounts);
      return { fixed: t.fixed + c.fixed, variable: t.variable + c.variable };
    },
    { fixed: 0, variable: 0 }
  );
  // Per-guest figures: the whole budget, and only the expenses that are priced by the number of guests, each divided by the
  // guests it is priced for (estimate: everyone invited; actual: the guests who have accepted).
  const guestItems = items.filter(isPerGuestItem);
  const guestEstimated = guestItems.reduce((sum, i) => sum + resolvedEstimatedCost(i, guestCounts), 0);
  const guestActual = guestItems.reduce((sum, i) => sum + resolvedActualCost(i, guestCounts), 0);
  const perHead = (total: number, heads: number) => (heads > 0 ? formatGBP(total / heads) : "—");
  const perGuestCards = [
    { title: "Per guest: whole budget", hint: "every expense", estimated: totalEstimated, actual: totalActual },
    { title: "Per guest: guest-dependent costs only", hint: `${guestItems.length} expense${guestItems.length === 1 ? "" : "s"} priced per guest`, estimated: guestEstimated, actual: guestActual },
  ];
  const minimums = items
    .filter(isPerGuestItem)
    .map((item) => ({ item, b: perGuestBreakdown(item, (guestCounts[item.event_id ?? ALL_GUESTS] ?? NO_EVENT_GUESTS).invited) }))
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
          <CardContent>
            <div className="text-lg font-semibold sm:text-2xl">{formatGBP(totalEstimated)}</div>
            <div className="text-xs text-muted-foreground">all {everyone.invited.total} invited</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Actual so far</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold sm:text-2xl">{formatGBP(totalActual)}</div>
            <div className="text-xs text-muted-foreground">{everyone.accepted.total} accepted so far</div>
          </CardContent>
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
            Budget for {everyone.invited.total} invited guest{everyone.invited.total === 1 ? "" : "s"}
            <span className="font-normal text-muted-foreground"> ({describeGuests(everyone.invited)})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">Total estimated</div>
              <div className="text-lg font-semibold">{formatGBP(totalEstimated)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Fixed costs</div>
              <div className="text-lg font-semibold">{formatGBP(split.fixed)}</div>
              <div className="text-xs text-muted-foreground">includes any minimum number of guests</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Depends on guest numbers</div>
              <div className="text-lg font-semibold">{formatGBP(split.variable)}</div>
            </div>
          </div>
          <div className="rounded-md bg-muted/40 px-3 py-2">
            <span className="text-xs text-muted-foreground">Accepted so far</span>{" "}
            <strong className="font-medium">
              {everyone.accepted.total} guest{everyone.accepted.total === 1 ? "" : "s"}
            </strong>{" "}
            <span className="text-muted-foreground">({describeGuests(everyone.accepted)})</span>
            <span className="text-muted-foreground"> · actual so far </span>
            <strong className="font-medium">{formatGBP(totalActual)}</strong>
          </div>
          {events.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {events.map((e) => {
                const c = guestCounts[e.id] ?? NO_EVENT_GUESTS;
                return (
                  <Badge key={e.id} variant="outline" className="h-auto px-2.5 py-1 font-normal whitespace-normal">
                    {e.name}: <strong className="ml-1 font-medium">{c.invited.total}</strong>
                    <span className="ml-1 text-muted-foreground">invited ·</span>
                    <strong className="ml-1 font-medium">{c.accepted.total}</strong>
                    <span className="ml-1 text-muted-foreground">accepted</span>
                  </Badge>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            The estimate is priced for every guest invited (including those who haven&apos;t replied or have declined); the actual is priced for the
            guests who have accepted. Mark a guest as an adult, teen or child on the Guests page; per-guest costs use the adult, teen or child rate set on
            each expense. If a supplier has a minimum number of guests, its value counts as a fixed cost.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {perGuestCards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {c.title}
                <span className="block text-xs font-normal text-muted-foreground">{c.hint}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Estimated</div>
                <div className="text-xl font-semibold">{perHead(c.estimated, everyone.invited.total)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatGBP(c.estimated)} ÷ {everyone.invited.total} invited
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Actual</div>
                <div className="text-xl font-semibold">{perHead(c.actual, everyone.accepted.total)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatGBP(c.actual)} ÷ {everyone.accepted.total} accepted
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {minimums.length > 0 && (
        <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="grid gap-1">
            <strong>
              You have invited fewer guests than {minimums.length === 1 ? "a supplier&apos;s" : "some suppliers&apos;"} minimum, so even if everyone comes you pay for empty places (
              {formatGBP(minimums.reduce((a, m) => a + m.b.shortfallCost, 0))}).
            </strong>
            {minimums.map(({ item, b }) => (
              <span key={item.id}>
                {item.category}
                {item.vendor_name ? ` (${item.vendor_name})` : ""}: minimum {b.minimum}, {b.adults + b.teens + b.children} invited. {b.shortfall} empty place{b.shortfall === 1 ? "" : "s"} × {formatGBP(b.adultRate)} = {formatGBP(b.shortfallCost)}.
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
              const counts = guestCounts[item.event_id ?? ALL_GUESTS] ?? NO_EVENT_GUESTS;
              const estimate = isPerGuestItem(item) ? perGuestBreakdown(item, counts.invited) : null;
              const actualSplit = isPerGuestItem(item) ? perGuestBreakdown(item, counts.accepted) : null;
              const actual = resolvedActualCost(item, guestCounts);
              const lines = (b: ReturnType<typeof perGuestBreakdown>) => (
                <div className="text-xs text-muted-foreground">
                  <div>
                    {b.adults} adult{b.adults === 1 ? "" : "s"} × {formatGBP(b.adultRate)}
                  </div>
                  {b.teens > 0 && (
                    <div>
                      {b.teens} teen{b.teens === 1 ? "" : "s"} × {formatGBP(b.teenRate)}
                    </div>
                  )}
                  {b.children > 0 && (
                    <div>
                      {b.children} child{b.children === 1 ? "" : "ren"} × {formatGBP(b.childRate)}
                    </div>
                  )}
                  {b.shortfall > 0 && (
                    <div className="text-amber-400">
                      + {b.shortfall} to reach the minimum of {b.minimum}
                    </div>
                  )}
                </div>
              );
              return (
                <TableRow key={item.id}>
                  <TableCell data-span="full" className="font-medium">{item.category}</TableCell>
                  <TableCell data-label="Vendor" className="text-muted-foreground">{item.vendor_name}</TableCell>
                  <TableCell data-label="Event" className="text-muted-foreground">
                    {item.event_id ? eventNameById.get(item.event_id) : "General"}
                  </TableCell>
                  <TableCell data-label="Estimated">
                    <div>{formatGBP(resolvedEstimatedCost(item, guestCounts))}</div>
                    {estimate && (
                      <>
                        <div className="text-xs text-muted-foreground">invited guests</div>
                        {lines(estimate)}
                      </>
                    )}
                  </TableCell>
                  <TableCell data-label="Actual">
                    {estimate && actualSplit ? (
                      <>
                        <div>{formatGBP(actual)}</div>
                        <div className="text-xs text-muted-foreground">accepted guests</div>
                        {lines(actualSplit)}
                      </>
                    ) : item.actual_cost != null ? (
                      formatGBP(item.actual_cost)
                    ) : (
                      "—"
                    )}
                  </TableCell>
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
