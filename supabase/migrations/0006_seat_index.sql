-- The seating chart now places guests on specific seats around a round table,
-- so each assignment records which seat (0-based, clockwise from the top).
alter table seat_assignments add column seat_index int not null default 0;
alter table seat_assignments add constraint seat_assignments_seat_unique unique (table_id, seat_index);
