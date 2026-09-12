import { listGuestsWithRsvps } from "@/app/actions/guests";
import { listEvents } from "@/app/actions/events";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GuestFormDialog } from "@/components/guests/guest-form-dialog";
import { ImportGuestsDialog } from "@/components/guests/import-guests-dialog";
import { RsvpCell } from "@/components/guests/rsvp-cell";
import { DeleteGuestButton } from "@/components/guests/delete-guest-button";
import { Badge } from "@/components/ui/badge";
import { guestFullName, type RsvpStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const [events, { guests, rsvps }] = await Promise.all([
    listEvents(),
    listGuestsWithRsvps(),
  ]);

  const rsvpByGuestAndEvent = new Map<string, RsvpStatus>();
  for (const rsvp of rsvps) {
    rsvpByGuestAndEvent.set(`${rsvp.guest_id}:${rsvp.event_id}`, rsvp.status);
  }
  const guestById = new Map(guests.map((g) => [g.id, g]));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Guests</h1>
          <p className="text-sm text-muted-foreground">
            {guests.length} guest{guests.length === 1 ? "" : "s"} on the list. Mark a guest{" "}
            <span className="text-status-critical">Declined</span> for an event to exclude them from that
            event's per-guest budget costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportGuestsDialog />
          <GuestFormDialog guests={guests} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              {events.map((event) => (
                <TableHead key={event.id}>{event.name}</TableHead>
              ))}
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((guest) => {
              const inviter = guest.plus_one_of ? guestById.get(guest.plus_one_of) : undefined;
              return (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">
                    <div>{guestFullName(guest)}</div>
                    {inviter && (
                      <Badge variant="secondary" className="mt-1 font-normal">
                        +1 of {guestFullName(inviter)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div>{guest.email}</div>
                    <div>{guest.phone}</div>
                  </TableCell>
                  {events.map((event) => (
                    <TableCell key={event.id}>
                      <RsvpCell
                        guestId={guest.id}
                        eventId={event.id}
                        status={rsvpByGuestAndEvent.get(`${guest.id}:${event.id}`) ?? "not_invited"}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <GuestFormDialog guests={guests} guest={guest} />
                      <DeleteGuestButton guestId={guest.id} guestName={guestFullName(guest)} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {guests.length === 0 && (
              <TableRow>
                <TableCell colSpan={3 + events.length} className="py-10 text-center text-muted-foreground">
                  No guests yet. Add your first one above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
