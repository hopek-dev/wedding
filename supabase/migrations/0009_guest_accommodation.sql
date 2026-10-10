-- Where a guest says they will stay (set on their RSVP). Holds a place id from
-- STAY_PLACES in src/lib/site-content.ts, or elsewhere / not-staying / undecided.
alter table guests add column if not exists accommodation text;
