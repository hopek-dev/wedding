-- Photos on the public wedding site, managed from the planner's Photos page.
-- One row per photo slot (ids are listed in src/lib/site-photos.ts). A row only exists once something has been
-- changed: a replacement picture (url) and/or where to aim the crop (focus_x / focus_y, percent) and/or the
-- description read out for screen readers (alt). With no row, the site uses the picture shipped with it.
create table site_photos (
  slot text primary key,
  url text,
  width int,
  height int,
  focus_x int,
  focus_y int,
  alt text,
  updated_at timestamptz not null default now()
);

alter table site_photos enable row level security;
