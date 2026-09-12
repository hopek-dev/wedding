import { listTasks } from "@/app/actions/tasks";
import { listEvents } from "@/app/actions/events";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskStatusCell } from "@/components/tasks/task-status-cell";
import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import { GanttChart } from "@/components/tasks/gantt-chart";
import { formatDate } from "@/lib/format";
import { taskVisualStatus } from "@/lib/gantt";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const priorityVariant: Record<Task["priority"], "outline" | "secondary" | "default"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
};

export default async function TasksPage() {
  const [tasks, events] = await Promise.all([listTasks(), listEvents()]);
  const eventNameById = new Map(events.map((e) => [e.id, e.name]));
  const openCount = tasks.filter((t) => t.status !== "done").length;
  const overdueCount = tasks.filter((t) => taskVisualStatus(t) === "overdue").length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Tasks &amp; Projects</h1>
          <p className="text-sm text-muted-foreground">
            {openCount} open task{openCount === 1 ? "" : "s"}
            {overdueCount > 0 && (
              <span className="text-status-critical"> · {overdueCount} overdue</span>
            )}
          </p>
        </div>
        <TaskFormDialog events={events} />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Category / Event</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const visualStatus = taskVisualStatus(task);
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {task.event_id ? eventNameById.get(task.event_id) : task.category}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(task.start_date)}</TableCell>
                      <TableCell className={cn(visualStatus === "overdue" && "font-medium text-status-critical")}>
                        {formatDate(task.due_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityVariant[task.priority]} className="capitalize">
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TaskStatusCell taskId={task.id} status={task.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TaskFormDialog events={events} task={task} />
                          <DeleteTaskButton taskId={task.id} title={task.title} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No tasks yet. Add your first one above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <GanttChart tasks={tasks} events={events} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
