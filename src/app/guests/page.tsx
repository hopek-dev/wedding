import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { InviteAllButton } from "@/components/guests/invite-all-button";
import { RsvpLinkButton } from "@/components/guests/rsvp-link-button";
import { DeleteGuestButton } from "@/components/guests/delete-guest-button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
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
  const plusOnesByHost = new Map<string, typeof guests>();
  for (const g of guests) {
    if (g.plus_one_of) plusOnesByHost.set(g.plus_one_of, [...(plusOnesByHost.get(g.plus_one_of) ?? []), g]);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Guests</h1>
          <p className="text-sm text-muted-foreground">
            {guests.length} guest{guests.length === 1 ? "" : "s"} on the list. Mark a guest{" "}
            <span className="text-status-critical">Declined</span> for an event to exclude them from that
            event&apos;s per-guest budget costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/invitations" />}>
            <Send className="size-4" />
            Send invitations
          </Button>
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
                <TableHead key={event.id}>
                  {event.name}
                  <InviteAllButton eventId={event.id} eventName={event.name} />
                </TableHead>
              ))}
              <TableHead className="w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((guest) => {
              const inviter = guest.plus_one_of ? guestById.get(guest.plus_one_of) : undefined;
              const plusOnes = plusOnesByHost.get(guest.id) ?? [];
              // An import note like "Plus one of Franco" that never got linked
              // (host not on the list) still deserves to show.
              const noteHost = !inviter ? guest.notes?.match(/plus[\s-]*one\s+of\s+(.+)/i)?.[1]?.trim() : undefined;
              return (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">
                    <div>{[guest.title, guestFullName(guest)].filter(Boolean).join(" ")}</div>
                    {guest.tag && (
                      <Badge variant="outline" className="mt-1 mr-1 font-normal">
                        {guest.tag}
                      </Badge>
                    )}
                    {inviter && (
                      <Badge variant="secondary" className="mt-1 font-normal">
                        +1 of {guestFullName(inviter)}
                      </Badge>
                    )}
                    {noteHost && (
                      <Badge variant="secondary" className="mt-1 font-normal">
                        +1 of {noteHost} (not linked)
                      </Badge>
                    )}
                    {plusOnes.map((p) => (
                      <Badge key={p.id} className="mt-1 mr-1 font-normal">
                        +1 {guestFullName(p)}
                      </Badge>
                    ))}
                    {plusOnes.length === 0 && guest.plus_ones_allowed > 0 && (
                      <Badge variant="outline" className="mt-1 font-normal text-muted-foreground">
                        +{guest.plus_ones_allowed} allowed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div>{guest.email}</div>
                    <div>{guest.phone}</div>
                    {guest.last_emailed_at && (
                      <div className="text-xs">Emailed {formatDate(guest.last_emailed_at)}</div>
                    )}
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
                      <RsvpLinkButton
                        guestId={guest.id}
                        token={guest.rsvp_token}
                        firstName={guest.first_name}
                        email={guest.email}
                        phone={guest.phone}
                        responded={!!guest.rsvp_responded_at}
                      />
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
