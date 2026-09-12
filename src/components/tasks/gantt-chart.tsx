import {
  barPosition,
  computeTimelineRange,
  datePct,
  groupTasks,
  monthTicks,
  taskVisualStatus,
  type TaskVisualStatus,
} from "@/lib/gantt";
import { formatDate } from "@/lib/format";
import type { Task, WeddingEvent } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const LABEL_WIDTH = 208;

const statusStyle: Record<TaskVisualStatus, string> = {
  todo: "bg-status-neutral",
  in_progress: "bg-status-info",
  done: "bg-status-good",
  overdue: "bg-status-critical",
};

const statusLabel: Record<TaskVisualStatus, string> = {
  todo: "Not started",
  in_progress: "In progress",
  done: "Done",
  overdue: "Overdue",
};

export function GanttChart({ tasks, events }: { tasks: Task[]; events: WeddingEvent[] }) {
  const groups = groupTasks(tasks, events);
  const allRanges = groups.flatMap((g) => g.ranges);

  if (allRanges.length === 0) {
    return (
      <div className="rounded-lg border bg-card py-16 text-center text-sm text-muted-foreground">
        Add a start or due date to a task to see it on the timeline.
      </div>
    );
  }

  const { start: rangeStart, end: rangeEnd } = computeTimelineRange(allRanges, events);
  const ticks = monthTicks(rangeStart, rangeEnd);
  const todayPct = datePct(new Date(), rangeStart, rangeEnd);
  const unplacedTasks = groups.flatMap((g) => g.unplaced);

  return (
    <div className="grid gap-3">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <div className="relative min-w-[720px]">
          {/* Today marker spans the full height of the chart */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-status-critical/50"
            style={{ left: `calc(${LABEL_WIDTH}px + (100% - ${LABEL_WIDTH}px) * ${todayPct / 100})` }}
          />

          {/* Header: month ticks */}
          <div className="flex border-b">
            <div className="shrink-0 border-r px-3 py-2 text-xs font-medium text-muted-foreground" style={{ width: LABEL_WIDTH }}>
              Task
            </div>
            <div className="relative h-9 flex-1">
              {ticks.map((tick) => (
                <div
                  key={tick.label}
                  className="absolute top-0 h-full border-l border-border/70"
                  style={{ left: `${tick.leftPct}%` }}
                >
                  <span className="ml-1.5 block pt-2 text-xs whitespace-nowrap text-muted-foreground">
                    {tick.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.key}>
              <div className="border-b bg-muted/40 px-3 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </div>
              {group.ranges.map(({ task, start, end }) => {
                const { leftPct, widthPct } = barPosition({ task, start, end }, rangeStart, rangeEnd);
                const status = taskVisualStatus(task);
                return (
                  <div key={task.id} className="flex border-b last:border-b-0">
                    <div
                      className="shrink-0 truncate border-r px-3 py-2 text-sm"
                      style={{ width: LABEL_WIDTH }}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                    <div className="relative flex-1 py-2">
                      <div
                        tabIndex={0}
                        className="group absolute h-5 cursor-default rounded-md outline-none"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        aria-label={`${task.title}: ${statusLabel[status]}, ${formatDate(task.start_date)} to ${formatDate(task.due_date)}`}
                      >
                        <div className={cn("h-full w-full rounded-md ring-1 ring-foreground/10", statusStyle[status])} />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground opacity-0 shadow-md ring-1 ring-foreground/10 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                          <span className="font-medium">{task.title}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {formatDate(task.start_date)}
                            {task.due_date && task.due_date !== task.start_date ? ` – ${formatDate(task.due_date)}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {(["todo", "in_progress", "done", "overdue"] as const).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", statusStyle[status])} />
            {statusLabel[status]}
          </span>
        ))}
      </div>

      {unplacedTasks.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {unplacedTasks.length} task{unplacedTasks.length === 1 ? "" : "s"} without a date aren&apos;t shown here:{" "}
          {unplacedTasks.map((t) => t.title).join(", ")}.
        </p>
      )}
    </div>
  );
}
