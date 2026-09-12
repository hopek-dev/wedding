-- Restructure guests: split full_name into first_name/last_name, drop the
-- "side" grouping and the free-text plus-one fields, and replace them with a
-- real link to another guest row (plus_one_of) so a plus-one is a first-class
-- guest with their own contact info and per-event RSVPs, not just a name string.

alter table guests add column first_name text;
alter table guests add column last_name text;
alter table guests add column plus_one_of uuid references guests(id) on delete set null;

-- Backfill from the old full_name column: first word -> first_name, the rest -> last_name.
update guests
set
  first_name = coalesce(nullif(split_part(full_name, ' ', 1), ''), 'Guest'),
  last_name = nullif(trim(substring(full_name from length(split_part(full_name, ' ', 1)) + 1)), '')
where first_name is null;

alter table guests alter column first_name set not null;

alter table guests drop column full_name;
alter table guests drop column side;
alter table guests drop column plus_one_allowed;
alter table guests drop column plus_one_name;
