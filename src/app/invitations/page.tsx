import { listEvents } from "@/app/actions/events";
import { listGuestsWithRsvps } from "@/app/actions/guests";
import { getRsvpDeadline } from "@/app/actions/settings";
import { InvitesBoard } from "@/components/invites/invites-board";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  const [events, { guests, rsvps }, deadline] = await Promise.all([listEvents(), listGuestsWithRsvps(), getRsvpDeadline()]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Invitations</h1>
        <p className="text-sm text-muted-foreground">
          Send each guest their personal RSVP link on WhatsApp, then track who has replied.
        </p>
      </div>
      <InvitesBoard events={events} guests={guests} rsvps={rsvps} deadline={deadline} />
    </div>
  );
}
