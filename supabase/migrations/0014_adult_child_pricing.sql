-- Adults and children, so a per-guest cost can have a different rate for each.
-- Every existing guest stays an adult until marked otherwise.
alter table guests add column if not exists age_group text not null default 'adult' check (age_group in ('adult', 'child'));

-- On a per-guest budget line: the rate for a child (blank = children cost the same as an adult), and the minimum
-- number of guests the supplier charges for (blank = no minimum). When there are fewer guests than the minimum,
-- the missing places are charged at the adult rate.
alter table budget_items add column if not exists child_cost numeric(10, 2);
alter table budget_items add column if not exists min_guests integer check (min_guests is null or min_guests >= 0);
