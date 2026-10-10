-- Gift registry: anything from any shop, plus guests' reservations.
create table registry_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  image_url text,
  price_text text,
  store text,
  note text,
  quantity int not null default 1 check (quantity >= 1),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table registry_claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references registry_items(id) on delete cascade,
  guest_name text not null,
  quantity int not null default 1 check (quantity >= 1),
  -- lets a guest undo their own reservation without an account
  cancel_token text not null,
  created_at timestamptz not null default now()
);

create index registry_claims_item_idx on registry_claims(item_id);

alter table registry_items enable row level security;
alter table registry_claims enable row level security;
