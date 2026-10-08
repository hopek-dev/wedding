// Shown on the seating page when the database is missing the seat_index column.
// Mirrors supabase/migrations/0006_seat_index.sql.
export const SEATING_SETUP_SQL = `-- Seat positions for the seating chart (safe to run more than once).
alter table seat_assignments add column if not exists seat_index int;

-- Give any existing seat records a position (first free seat, in order).
update seat_assignments a
set seat_index = r.rn - 1
from (
  select id, row_number() over (partition by table_id order by created_at, id) as rn
  from seat_assignments
) r
where a.id = r.id and a.seat_index is null;

alter table seat_assignments alter column seat_index set not null;
alter table seat_assignments drop constraint if exists seat_assignments_seat_unique;
alter table seat_assignments add constraint seat_assignments_seat_unique unique (table_id, seat_index);
`;
