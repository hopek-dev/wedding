-- A guest can mark a reserved gift as bought.
alter table registry_claims add column if not exists purchased_at timestamptz;
