-- Extend tasks for full project tracking: a start date (so tasks can span a
-- range, not just have a due date) and a free-text category so tasks that
-- aren't tied to one of the three events (dress purchase, flights, legal
-- paperwork, ...) still have a grouping to render under in the task list and
-- Gantt timeline.

alter table tasks add column start_date date;
alter table tasks add column category text not null default 'General';

-- Backfill: for any pre-existing rows, use due_date as start_date too so
-- nothing renders as a zero-width/invalid bar in the timeline.
update tasks set start_date = due_date where start_date is null and due_date is not null;
