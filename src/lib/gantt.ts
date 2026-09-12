import type { Task, WeddingEvent } from "@/lib/supabase/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ResolvedTaskRange {
  task: Task;
  start: Date;
  end: Date;
}

function toDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// A task needs at least one date to be placed on the timeline. If only one
// of start/due is set, treat it as a single-day bar on that date.
export function resolveTaskRange(task: Task): ResolvedTaskRange | null {
  const start = toDate(task.start_date);
  const end = toDate(task.due_date);
  if (!start && !end) return null;
  const resolvedStart = start ?? end!;
  const resolvedEnd = end ?? start!;
  return {
    task,
    start: resolvedStart < resolvedEnd ? resolvedStart : resolvedEnd,
    end: resolvedStart < resolvedEnd ? resolvedEnd : resolvedStart,
  };
}

export function computeTimelineRange(ranges: ResolvedTaskRange[], events: WeddingEvent[]) {
  const dates: Date[] = [];
  for (const r of ranges) {
    dates.push(r.start, r.end);
  }
  for (const e of events) {
    const d = toDate(e.starts_at);
    if (d) dates.push(d);
  }
  dates.push(new Date());

  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Snap to month boundaries and pad a week on each side so bars never touch
  // the chart edge.
  const start = new Date(min.getFullYear(), min.getMonth(), 1);
  start.setDate(start.getDate() - 3);
  const end = new Date(max.getFullYear(), max.getMonth() + 1, 0);
  end.setDate(end.getDate() + 3);

  return { start, end };
}

export function datePct(date: Date, rangeStart: Date, rangeEnd: Date) {
  const total = rangeEnd.getTime() - rangeStart.getTime();
  if (total <= 0) return 0;
  const offset = date.getTime() - rangeStart.getTime();
  return Math.min(100, Math.max(0, (offset / total) * 100));
}

export function barPosition(range: ResolvedTaskRange, rangeStart: Date, rangeEnd: Date) {
  const left = datePct(range.start, rangeStart, rangeEnd);
  // Bar spans through the end of the due date, not midnight at its start.
  const endOfDay = new Date(range.end.getTime() + DAY_MS);
  const right = datePct(endOfDay, rangeStart, rangeEnd);
  return { leftPct: left, widthPct: Math.max(right - left, 0.6) };
}

export interface MonthTick {
  label: string;
  leftPct: number;
}

export function monthTicks(rangeStart: Date, rangeEnd: Date): MonthTick[] {
  const ticks: MonthTick[] = [];
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (cursor <= rangeEnd) {
    // A month-start before rangeStart would otherwise clamp to 0% and bunch
    // up against the next real tick -- skip it instead of showing a
    // misleadingly-overlapping label.
    if (cursor >= rangeStart) {
      ticks.push({
        label: cursor.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        leftPct: datePct(cursor, rangeStart, rangeEnd),
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return ticks;
}

export type TaskVisualStatus = "overdue" | "done" | "in_progress" | "todo";

export function taskVisualStatus(task: Task): TaskVisualStatus {
  if (task.status === "done") return "done";
  const due = toDate(task.due_date);
  if (due && due.getTime() < Date.now() - DAY_MS) return "overdue";
  return task.status === "in_progress" ? "in_progress" : "todo";
}

export interface TaskGroup {
  key: string;
  label: string;
  ranges: ResolvedTaskRange[];
  unplaced: Task[];
}

export function groupTasks(tasks: Task[], events: WeddingEvent[]): TaskGroup[] {
  const eventById = new Map(events.map((e) => [e.id, e]));
  const groups = new Map<string, TaskGroup>();

  for (const event of events) {
    groups.set(`event:${event.id}`, { key: `event:${event.id}`, label: event.name, ranges: [], unplaced: [] });
  }

  for (const task of tasks) {
    const key = task.event_id && eventById.has(task.event_id)
      ? `event:${task.event_id}`
      : `category:${task.category}`;
    if (!groups.has(key)) {
      groups.set(key, { key, label: task.category, ranges: [], unplaced: [] });
    }
    const group = groups.get(key)!;
    const resolved = resolveTaskRange(task);
    if (resolved) {
      group.ranges.push(resolved);
    } else {
      group.unplaced.push(task);
    }
  }

  return Array.from(groups.values()).filter((g) => g.ranges.length > 0 || g.unplaced.length > 0);
}
