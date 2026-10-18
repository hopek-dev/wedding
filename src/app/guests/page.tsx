import { stayLabel } from "@/lib/site-content";
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
import { AgeBadge } from "@/components/guests/age-badge";
import { GuestSearch } from "@/components/guests/guest-search";
import { ImportGuestsDialog } from "@/components/guests/import-guests-dialog";
import { RsvpCell } from "@/components/guests/rsvp-cell";
import { InviteAllButton } from "@/components/guests/invite-all-button";
import { RsvpLinkButton } from "@/components/guests/rsvp-link-button";
import { DeleteGuestButton } from "@/components/guests/delete-guest-button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { partyFirstNames, totalUnnamed } from "@/lib/party";
import { guestFullName, type RsvpStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag: tagParam } = await searchParams;
  const [events, { guests, rsvps }] = await Promise.all([
    listEvents(),
    listGuestsWithRsvps(),
  ]);

  const rsvpByGuestAndEvent = new Map<string, RsvpStatus>();
  for (const rsvp of rsvps) {
    rsvpByGuestAndEvent.set(`${rsvp.guest_id}:${rsvp.event_id}`, rsvp.status);
  }
  const guestById = new Map(guests.map((g) => [g.id, g]));
  // What each guest has said they can't eat. It is stored against each event they answered for, so the same note can
  // appear several times: show each different note once.
  const dietaryByGuest = new Map<string, string[]>();
  for (const r of rsvps) {
    const note = r.dietary_notes?.trim();
    if (!note) continue;
    const list = dietaryByGuest.get(r.guest_id) ?? [];
    if (!list.some((x) => x.toLowerCase() === note.toLowerCase())) dietaryByGuest.set(r.guest_id, [...list, note]);
  }
  // Filter by tag (?tag=Hope). A plus-one is shown with their host, so they follow the host's tag.
  const tagOf = (g: (typeof guests)[number]) => (g.plus_one_of ? guestById.get(g.plus_one_of)?.tag : g.tag)?.trim() || "";
  const tagCounts = new Map<string, number>();
  for (const g of guests) if (!g.plus_one_of && g.tag?.trim()) tagCounts.set(g.tag.trim(), (tagCounts.get(g.tag.trim()) ?? 0) + 1);
  const tags = [...tagCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const activeTag = tagParam && tagCounts.has(tagParam) ? tagParam : "";
  const shownGuests = activeTag ? guests.filter((g) => tagOf(g) === activeTag) : guests;
  const plusOnesByHost = new Map<string, typeof guests>();
  for (const g of guests) {
    if (g.plus_one_of) plusOnesByHost.set(g.plus_one_of, [...(plusOnesByHost.get(g.plus_one_of) ?? []), g]);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Guests</h1>
          <p className="text-sm text-muted-foreground">
            {guests.length + totalUnnamed(guests)} guest{guests.length + totalUnnamed(guests) === 1 ? "" : "s"} expected
            {totalUnnamed(guests) > 0
              ? ` (${guests.length} named, ${totalUnnamed(guests)} +1${totalUnnamed(guests) === 1 ? "" : "s"} not named yet)`
              : ""}
            {guests.some((g) => g.age_group === "child") ? ` · ${guests.filter((g) => g.age_group === "child").length} child${guests.filter((g) => g.age_group === "child").length === 1 ? "" : "ren"}` : ""}
            . Mark a guest{" "}
            <span className="text-status-critical">Declined</span> for an event to exclude them from that
            event&apos;s per-guest budget costs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/invitations" />}>
            <Send className="size-4" />
            Send invitations
          </Button>
          <ImportGuestsDialog />
          <GuestFormDialog guests={guests} />
        </div>
      </div>

      <GuestSearch key={activeTag} total={shownGuests.length} />

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Guest list:</span>
          {[{ key: "", label: "Everyone", n: guests.filter((g) => !g.plus_one_of).length }, ...tags.map(([t, n]) => ({ key: t, label: t, n }))].map(({ key, label, n }) => (
            <Link
              key={key || "all"}
              href={key ? `/guests?tag=${encodeURIComponent(key)}` : "/guests"}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${activeTag === key ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {label} <span className="tabular-nums opacity-70">{n}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table className="stack-table">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Staying</TableHead>
              <TableHead>Dietary requirements</TableHead>
              <TableHead>Song to dance to</TableHead>
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
            {shownGuests.map((guest) => {
              const inviter = guest.plus_one_of ? guestById.get(guest.plus_one_of) : undefined;
              const plusOnes = plusOnesByHost.get(guest.id) ?? [];
              // An import note like "Plus one of Franco" that never got linked
              // (host not on the list) still deserves to show.
              const noteHost = !inviter ? guest.notes?.match(/plus[\s-]*one\s+of\s+(.+)/i)?.[1]?.trim() : undefined;
              // What the search box looks through for this guest (see GuestSearch).
              const answerWord = (id: string) => ({ confirmed: "accepted", invited: "pending", declined: "declined", not_invited: "not invited" })[rsvpByGuestAndEvent.get(`${guest.id}:${id}`) ?? "not_invited"];
              const searchText = [
                guest.title,
                guestFullName(guest),
                guest.age_group === "child" ? "child" : "adult",
                guest.tag,
                guest.email,
                guest.phone,
                guest.notes,
                inviter && `plus one of ${guestFullName(inviter)}`,
                ...plusOnes.map((p) => `plus one ${guestFullName(p)}`),
                stayLabel(guest.accommodation),
                ...(dietaryByGuest.get(guest.id) ?? []),
                guest.song_request,
                ...events.map((e) => `${e.name} ${answerWord(e.id)}`),
              ]
                .filter(Boolean)
                .join(" | ")
                .toLowerCase();
              return (
                <TableRow key={guest.id} data-guest-row="" data-search={searchText} data-digits={(guest.phone ?? "").replace(/\D/g, "")}>
                  <TableCell data-span="full" className="max-w-[18rem] font-medium whitespace-normal">
                    <div>{[guest.title, guestFullName(guest)].filter(Boolean).join(" ")}</div>
                    <AgeBadge key={`${guest.id}-${guest.age_group ?? "adult"}`} guestId={guest.id} ageGroup={guest.age_group === "child" ? "child" : "adult"} />
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
                    {guest.plus_ones_allowed - plusOnes.length > 0 && (
                      <Badge variant="outline" className="mt-1 font-normal text-muted-foreground">
                        +{guest.plus_ones_allowed - plusOnes.length} not named yet
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell data-label="Contact" className="text-muted-foreground">
                    <div>{guest.email}</div>
                    <div>{guest.phone}</div>
                    {guest.last_emailed_at && (
                      <div className="text-xs">Emailed {formatDate(guest.last_emailed_at)}</div>
                    )}
                  </TableCell>
                  <TableCell data-label="Staying" className="text-muted-foreground">
                    {stayLabel(guest.accommodation) || <span className="opacity-50">&ndash;</span>}
                  </TableCell>
                  <TableCell data-label="Dietary requirements" className="max-w-[16rem] whitespace-normal">
                    {dietaryByGuest.get(guest.id)?.join("; ") ?? <span className="text-muted-foreground opacity-50">&ndash;</span>}
                  </TableCell>
                  <TableCell data-label="Song to dance to" className="max-w-[14rem] whitespace-normal">
                    {guest.song_request?.trim() || <span className="text-muted-foreground opacity-50">&ndash;</span>}
                  </TableCell>
                  {events.map((event) => (
                    <TableCell data-label={event.name} key={event.id}>
                      <RsvpCell
                        guestId={guest.id}
                        eventId={event.id}
                        status={rsvpByGuestAndEvent.get(`${guest.id}:${event.id}`) ?? "not_invited"}
                      />
                    </TableCell>
                  ))}
                  <TableCell data-span="full">
                    <div className="flex items-center gap-1">
                      {/* A plus-one shares their host's invitation, so only the host gets a link to send. */}
                      {!guest.plus_one_of && (
                      <RsvpLinkButton
                        guestId={guest.id}
                        token={guest.rsvp_token}
                        firstName={partyFirstNames([guest, ...plusOnes])}
                        email={guest.email}
                        phone={guest.phone}
                        responded={!!guest.rsvp_responded_at}
                      />
                      )}
                      <GuestFormDialog guests={guests} guest={guest} />
                      <DeleteGuestButton guestId={guest.id} guestName={guestFullName(guest)} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {guests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6 + events.length} className="py-10 text-center text-muted-foreground">
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
