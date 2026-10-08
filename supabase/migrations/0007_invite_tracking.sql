-- Track when (and how) each guest's RSVP link was sent, so the Invitations
-- page can show Not sent / Sent / Responded and queue reminders.
alter table guests add column invite_sent_at timestamptz;
alter table guests add column invite_channel text;
