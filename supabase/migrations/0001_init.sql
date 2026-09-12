-- Wedding planner schema
-- Private app: no RLS policies for anon/auth roles are defined here because
-- all reads/writes happen through Next.js Server Actions using the service
-- role key (never exposed to the browser). RLS is enabled with no policies,
-- which blocks the anon/authenticated roles by default.

create extension if not exists "pgcrypto";

create table events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique, -- 'ceremony' | 'reception' | 'boat_party' | custom slug
  name text not null,
  venue_name text,
  address text,
  starts_at timestamptz,
  ends_at timestamptz,
  dress_code text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  side text check (side in ('partner_1', 'partner_2', 'both')) default 'both',
  plus_one_allowed boolean not null default false,
  plus_one_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guest_rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  status text not null check (status in ('not_invited', 'invited', 'confirmed', 'declined')) default 'not_invited',
  headcount int not null default 1,
  dietary_notes text,
  updated_at timestamptz not null default now(),
  unique (guest_id, event_id)
);

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  vendor_name text,
  event_id uuid references events(id) on delete set null,
  estimated_cost numeric(10, 2) not null default 0,
  actual_cost numeric(10, 2),
  amount_paid numeric(10, 2) not null default 0,
  due_date date,
  status text not null check (status in ('planned', 'booked', 'paid')) default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_id uuid references events(id) on delete set null,
  due_date date,
  status text not null check (status in ('todo', 'in_progress', 'done')) default 'todo',
  priority text not null check (priority in ('low', 'medium', 'high')) default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table events enable row level security;
alter table guests enable row level security;
alter table guest_rsvps enable row level security;
alter table budget_items enable row level security;
alter table tasks enable row level security;

-- Seed the three known events so the UI has something to edit immediately.
insert into events (event_key, name, venue_name, address, notes, sort_order) values
  ('ceremony', 'Ceremony', 'Marylebone Town Hall (TBD vs Chelsea)', 'London', 'Legal ceremony at a London town hall.', 1),
  ('reception', 'Reception', 'TBD restaurant', 'London', 'Sit-down meal and speeches.', 2),
  ('boat_party', 'Boat Party', 'TBD boat/venue', 'London', 'Evening party on the water.', 3);
