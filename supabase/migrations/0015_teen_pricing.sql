-- A third age group, teens, with their own rate on per-guest budget lines (blank = same as an adult).
alter table guests drop constraint if exists guests_age_group_check;
alter table guests add constraint guests_age_group_check check (age_group in ('adult', 'teen', 'child'));
alter table budget_items add column if not exists teen_cost numeric(10, 2);
