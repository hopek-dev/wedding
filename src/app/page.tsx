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

  const confirmedCount = rsvps.filter((r) => r.status === "confirmed").length;
  const invitedCount = rsvps.filter((r) => r.status === "invited").length;
  const declinedCount = rsvps.filter((r) => r.status === "declined").length;

  const guestCounts = guestCountsByEvent(events.map((e) => e.id), rsvps);
  const totalEstimated = budgetItems.reduce((sum, i) => sum + resolvedEstimatedCost(i, guestCounts), 0);
  const totalPaid = budgetItems.reduce((sum, i) => sum + Number(i.amount_paid), 0);
  const paidPct = totalEstimated > 0 ? Math.min(100, (totalPaid / totalEstimated) * 100) : 0;

  const openTaskCount = tasks.filter((t) => t.status !== "done").length;
  const overdueTaskCount = tasks.filter((t) => taskVisualStatus(t) === "overdue").length;

  const budgetByCategory = categoryTotals(budgetItems, guestCounts);
  const variance = totalVariance(budgetItems, guestCounts);

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
              <div className="text-2xl font-semibold">{guests.length} on the list</div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">{confirmedCount} confirmed</span>
                <span className="text-amber-600 dark:text-amber-400">{invitedCount} invited</span>
                <span className="text-red-600 dark:text-red-400">{declinedCount} declined</span>
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
                <div className="mt-1 text-xs text-muted-foreground">{Math.round(paidPct)}% of estimate paid</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Budget by category</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Estimated, actual, and paid spend for each category.</p>
        <CategoryBarChart data={budgetByCategory} />
      </div>
    </div>
  );
}
