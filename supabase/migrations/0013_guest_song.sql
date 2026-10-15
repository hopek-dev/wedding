-- The song a guest says will get them dancing (asked on their RSVP page).
alter table guests add column if not exists song_request text;
