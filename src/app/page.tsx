import Link from "next/link";
import { listEvents } from "@/app/actions/events";
import { listGuestsWithRsvps } from "@/app/actions/guests";
import { listBudgetItems } from "@/app/actions/budget";
import { listTasks } from "@/app/actions/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDateTime, formatGBP } from "@/lib/format";
import { taskVisualStatus } from "@/lib/gantt";
import { categoryTotals, guestCountsByEvent, resolvedEstimatedCost, totalVariance } from "@/lib/budget";
import { totalUnnamed } from "@/lib/party";
import { tagSplit } from "@/lib/tag-split";
import { CategoryBarChart } from "@/components/budget/category-bar-chart";
import { Landmark, UtensilsCrossed, Ship, MapPin, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const eventIcons: Record<string, typeof Landmark> = {
  ceremony: Landmark,
  reception: UtensilsCrossed,
  boat_party: Ship,
};

export default async function DashboardPage() {
  const [events, { guests, rsvps }, budgetItems, tasks] = await Promise.all([
    listEvents(),
    listGuestsWithRsvps(),
    listBudgetItems(),
    listTasks(),
  ]);

  const ceremony = events.find((e) => e.event_key === "ceremony");
  const daysToGo = ceremony?.starts_at
    ? Math.ceil((new Date(ceremony.starts_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Each guest counts once, however many events they're invited to:
  // coming to anything = confirmed; otherwise still waiting on at least one
  // event = awaiting reply; otherwise declined everything; otherwise not invited.
  const guestStatus = new Map<string, "confirmed" | "awaiting" | "declined" | "none">();
  for (const g of guests) {
    const mine = rsvps.filter((r) => r.guest_id === g.id).map((r) => r.status);
    guestStatus.set(
      g.id,
      mine.includes("confirmed")
        ? "confirmed"
        : mine.includes("invited")
          ? "awaiting"
          : mine.includes("declined")
            ? "declined"
            : "none"
    );
  }
  const countOf = (s: string) => [...guestStatus.values()].filter((v) => v === s).length;
  const confirmedCount = countOf("confirmed");
  const awaitingCount = countOf("awaiting");
  const declinedCount = countOf("declined");
  const notInvitedCount = countOf("none");

  const split = tagSplit(guests, guestStatus);
  const splitTotal = split.reduce((a, r) => a + r.total, 0);
  const tagLabel = (t: string) => t || "No tag";
  const tagColors = ["bg-primary", "bg-primary/55", "bg-primary/30", "bg-muted-foreground/40"];

  const eventStats = (eventId: string) => {
    const rows = rsvps.filter((r) => r.event_id === eventId);
    return {
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      awaiting: rows.filter((r) => r.status === "invited").length,
    };
  };

  const guestCounts = guestCountsByEvent(events.map((e) => e.id), rsvps, guests);
  const totalEstimated = budgetItems.reduce((sum, i) => sum + resolvedEstimatedCost(i, guestCounts), 0);
  const totalPaid = budgetItems.reduce((sum, i) => sum + Number(i.amount_paid), 0);

  const openTaskCount = tasks.filter((t) => t.status !== "done").length;
  const overdueTaskCount = tasks.filter((t) => taskVisualStatus(t) === "overdue").length;

  const budgetByCategory = categoryTotals(budgetItems, guestCounts);
  const variance = totalVariance(budgetItems, guestCounts);
  const amountOwed = Math.max(variance.actual - totalPaid, 0);
  const paidPct = variance.actual > 0 ? Math.min(100, (totalPaid / variance.actual) * 100) : 0;

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {daysToGo != null && daysToGo >= 0
            ? `${daysToGo} day${daysToGo === 1 ? "" : "s"} to go`
            : "Planning the big day"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Town hall ceremony, restaurant reception, and a boat party — here&apos;s where things stand.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {events.map((event) => {
          const Icon = eventIcons[event.event_key] ?? MapPin;
          return (
            <Link key={event.id} href="/events">
              <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/40 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_28px_-10px_rgba(0,0,0,0.16)] active:translate-y-0 active:scale-[0.98]">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Icon className="size-4 text-primary" />
                  <CardTitle className="text-sm font-medium">{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-medium">{event.venue_name || "Venue TBD"}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(event.starts_at)}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {eventStats(event.id).confirmed} confirmed · {eventStats(event.id).awaiting} awaiting reply
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/tasks">
          <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/40 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_28px_-10px_rgba(0,0,0,0.16)] active:translate-y-0 active:scale-[0.98]">
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="text-2xl font-semibold">{openTaskCount} open</div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                {overdueTaskCount > 0 ? (
                  <span className="text-status-critical">{overdueTaskCount} overdue</span>
                ) : (
                  <span>Nothing overdue</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/guests">
          <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/40 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_28px_-10px_rgba(0,0,0,0.16)] active:translate-y-0 active:scale-[0.98]">
            <CardHeader>
              <CardTitle>Guests</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div>
                <div className="text-2xl font-semibold">{guests.length + totalUnnamed(guests)} guests</div>
                {totalUnnamed(guests) > 0 && (
                  <div className="text-xs text-muted-foreground">
                    incl. {totalUnnamed(guests)} +1{totalUnnamed(guests) === 1 ? "" : "s"} not named yet
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">{confirmedCount} confirmed</span>
                <span className="text-amber-600 dark:text-amber-400">{awaitingCount} awaiting reply</span>
                <span className="text-red-600 dark:text-red-400">{declinedCount} declined</span>
                {notInvitedCount > 0 && <span>{notInvitedCount} not invited</span>}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/budget">
          <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/40 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_28px_-10px_rgba(0,0,0,0.16)] active:translate-y-0 active:scale-[0.98]">
            <CardHeader>
              <CardTitle>Budget</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Estimated</div>
                  <div className="text-lg font-semibold">{formatGBP(totalEstimated)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Actual</div>
                  <div className="text-lg font-semibold">{formatGBP(variance.actual)}</div>
                  {variance.variance !== 0 && (
                    <div
                      className={cn(
                        "flex items-center gap-0.5 text-[11px] font-medium",
                        variance.variance > 0 ? "text-status-critical" : "text-status-good"
                      )}
                    >
                      {variance.variance > 0 ? (
                        <TrendingUp className="size-3" />
                      ) : (
                        <TrendingDown className="size-3" />
                      )}
                      {formatGBP(Math.abs(variance.variance))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Paid</div>
                  <div className="text-lg font-semibold">{formatGBP(totalPaid)}</div>
                </div>
              </div>
              <div>
                <Progress value={paidPct} />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(paidPct)}% of actual paid</span>
                  {amountOwed > 0 && <span>{formatGBP(amountOwed)} owed</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {split.length > 0 && (
        <Link href="/guests">
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/40 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_28px_-10px_rgba(0,0,0,0.16)] active:translate-y-0 active:scale-[0.98]">
            <CardHeader>
              <CardTitle>Guest split by tag</CardTitle>
              <p className="text-sm text-muted-foreground">
                Everyone invited, grouped by tag. +1s that are allowed but not named yet are included in each total.
              </p>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div>
                <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={split.map((r) => `${tagLabel(r.tag)} ${r.total}`).join(", ")}>
                  {split.map((r, i) => (
                    <div key={r.tag} className={tagColors[Math.min(i, tagColors.length - 1)]} style={{ width: `${(r.total / splitTotal) * 100}%` }} />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {split.map((r, i) => (
                    <span key={r.tag} className="inline-flex items-center gap-1.5">
                      <span className={cn("size-2.5 rounded-full", tagColors[Math.min(i, tagColors.length - 1)])} />
                      <span className="font-medium">{tagLabel(r.tag)}</span>
                      <span className="text-muted-foreground">
                        {r.total} ({Math.round((r.total / splitTotal) * 100)}%)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-1.5 pr-3 font-medium">Tag</th>
                      <th className="px-2 py-1.5 text-right font-medium">Total</th>
                      <th className="px-2 py-1.5 text-right font-medium text-emerald-600 dark:text-emerald-400">Confirmed</th>
                      <th className="px-2 py-1.5 text-right font-medium text-amber-600 dark:text-amber-400">Awaiting</th>
                      <th className="px-2 py-1.5 text-right font-medium text-red-600 dark:text-red-400">Declined</th>
                      <th className="px-2 py-1.5 text-right font-medium">Not invited</th>
                      <th className="py-1.5 pl-2 text-right font-medium">+1 to name</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {split.map((r) => (
                      <tr key={r.tag} className="border-t">
                        <td className="py-2 pr-3 font-medium">{tagLabel(r.tag)}</td>
                        <td className="px-2 py-2 text-right font-semibold">{r.total}</td>
                        <td className="px-2 py-2 text-right">{r.confirmed}</td>
                        <td className="px-2 py-2 text-right">{r.awaiting}</td>
                        <td className="px-2 py-2 text-right">{r.declined}</td>
                        <td className="px-2 py-2 text-right">{r.notInvited}</td>
                        <td className="py-2 pl-2 text-right">{r.unnamed}</td>
                      </tr>
                    ))}
                    {split.length > 1 && (
                      <tr className="border-t font-semibold">
                        <td className="py-2 pr-3">All</td>
                        <td className="px-2 py-2 text-right">{splitTotal}</td>
                        <td className="px-2 py-2 text-right">{split.reduce((a, r) => a + r.confirmed, 0)}</td>
                        <td className="px-2 py-2 text-right">{split.reduce((a, r) => a + r.awaiting, 0)}</td>
                        <td className="px-2 py-2 text-right">{split.reduce((a, r) => a + r.declined, 0)}</td>
                        <td className="px-2 py-2 text-right">{split.reduce((a, r) => a + r.notInvited, 0)}</td>
                        <td className="py-2 pl-2 text-right">{split.reduce((a, r) => a + r.unnamed, 0)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Budget by category</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Estimated, actual, and paid spend for each category.</p>
        <CategoryBarChart data={budgetByCategory} />
      </div>
    </div>
  );
}
