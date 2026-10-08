-- Guest-list import fields, public RSVP links, and seating plans.

-- Extra guest columns from the Excel guest-list format:
-- Title, Tag, Plus Ones (count allowed), Last Email (date last emailed).
alter table guests add column title text;
alter table guests add column tag text;
alter table guests add column plus_ones_allowed int not null default 0;
alter table guests add column last_emailed_at timestamptz;

-- Unguessable per-guest token used in the public RSVP link (/rsvp/<token>).
-- The volatile default is evaluated per row, so existing guests get one too.
alter table guests add column rsvp_token text not null unique default encode(gen_random_bytes(12), 'hex');
alter table guests add column rsvp_responded_at timestamptz;

-- Seating: tables live on a per-event floor plan. x/y are percentages (0-100)
-- of the floor-plan canvas so the layout scales across screen sizes.
create table seating_tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  shape text not null check (shape in ('round', 'rect')) default 'round',
  capacity int not null default 8 check (capacity > 0),
  x numeric(5, 2) not null default 50,
  y numeric(5, 2) not null default 50,
  created_at timestamptz not null default now()
);

-- One seat per guest per event.
create table seat_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  table_id uuid not null references seating_tables(id) on delete cascade,
  guest_id uuid not null references guests(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, guest_id)
);

alter table seating_tables enable row level security;
alter table seat_assignments enable row level security;
