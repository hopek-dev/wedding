-- Small key/value store for app-wide settings. First use: 'rsvp_deadline'
-- (a YYYY-MM-DD date after which guests can no longer change their RSVP).
create table app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;
