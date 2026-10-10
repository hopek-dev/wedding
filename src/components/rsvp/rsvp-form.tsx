"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Check, MapPin, PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitRsvp, type RsvpParty } from "@/app/actions/rsvp";
import { EventNames } from "@/components/rsvp/event-names";
import { inviteSummary } from "@/lib/invitation";
import { daysUntil, formatDeadline } from "@/lib/rsvp-deadline";
import { WEDDING_SITE_URL } from "@/lib/site";
import { guestFullName, type Guest } from "@/lib/supabase/types";
import { partyFirstNames, partyGreeting } from "@/lib/party";
import { cn } from "@/lib/utils";

type Choice = "yes" | "no" | undefined;

const blankSlots = (n: number) => Array.from({ length: Math.max(0, n) }, () => ({ first: "", last: "", diet: "" }));

export function RsvpForm({ party, token, preview = false }: { party: RsvpParty; token: string; preview?: boolean }) {
  const rsvpOf = (guestId: string, eventId: string) =>
    party.rsvps.find((r) => r.guest_id === guestId && r.event_id === eventId);

  const [choices, setChoices] = useState<Record<string, Choice>>(() => {
    const initial: Record<string, Choice> = {};
    for (const r of party.rsvps) {
      if (r.status === "confirmed") initial[`${r.guest_id}:${r.event_id}`] = "yes";
      if (r.status === "declined") initial[`${r.guest_id}:${r.event_id}`] = "no";
    }
    return initial;
  });
  const [dietary, setDietary] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      party.members.map((m) => [
        m.id,
        party.rsvps.find((r) => r.guest_id === m.id && r.dietary_notes)?.dietary_notes ?? "",
      ])
    )
  );
  // Plus-ones the guest adds on this page. They are saved straight away, so they
  // appear in the reply list below without reloading.
  const [extra, setExtra] = useState<Guest[]>([]);
  const [plusOnes, setPlusOnes] = useState(() => blankSlots(party.openPlusOneSlots));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const locked = party.closed;
  const summary = inviteSummary(party.events);
  // A plus-one added on this page is shown straight away, but once the page refreshes with the saved
  // data they are already in party.members, so only the ones not yet there are added on top.
  const pending = extra.filter((g) => !party.members.some((m) => m.id === g.id));
  const members = [...party.members, ...pending];
  const openSlots = Math.max(0, party.openPlusOneSlots - pending.length);

  const invited = (guestId: string, eventId: string) => {
    const r = rsvpOf(pending.some((g) => g.id === guestId) ? party.guest.id : guestId, eventId);
    return !!r && r.status !== "not_invited";
  };

  const unanswered = members.some((m) =>
    party.events.some((e) => invited(m.id, e.id) && !choices[`${m.id}:${e.id}`])
  );

  // A plus-one just added here shows in the reply list straight away, and
  // attends whatever the invitee attends.
  function addPlusOnes(added: Guest[]) {
    setExtra((cur) => [...cur, ...added]);
    setChoices((cur) => {
      const next = { ...cur };
      for (const g of added)
        for (const e of party.events) {
          const host = cur[`${party.guest.id}:${e.id}`];
          if (host) next[`${g.id}:${e.id}`] = host;
        }
      return next;
    });
    setPlusOnes(blankSlots(openSlots - added.length));
  }

  async function handleSubmit() {
    if (preview) {
      toast.info("This is a preview, so replies aren't saved.");
      const pretend = plusOnes
        .slice(0, openSlots)
        .filter((p) => p.first.trim())
        .map((p, i) => ({ ...party.guest, id: `preview-added-${pending.length + i}`, first_name: p.first.trim(), last_name: p.last.trim() || null, plus_one_of: party.guest.id, diet: p.diet.trim() }));
      if (pretend.length) {
        setDietary((d) => ({ ...d, ...Object.fromEntries(pretend.filter((g) => g.diet).map((g) => [g.id, g.diet])) }));
        addPlusOnes(pretend);
      }
      setDone(true);
      return;
    }
    setSaving(true);
    try {
      const answers = members.flatMap((m) =>
        party.events
          .filter((e) => invited(m.id, e.id) && choices[`${m.id}:${e.id}`])
          .map((e) => ({
            guest_id: m.id,
            event_id: e.id,
            attending: choices[`${m.id}:${e.id}`] === "yes",
            dietary_notes: dietary[m.id],
          }))
      );
      const newPlusOnes = plusOnes
        .slice(0, openSlots)
        .filter((p) => p.first.trim())
        .map((p) => ({ first_name: p.first.trim(), last_name: p.last.trim() || undefined, dietary_notes: p.diet.trim() || undefined }));
      const result = await submitRsvp({ token, answers, newPlusOnes });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.added.length) {
        // keep what was typed for each new plus-one, so it shows in their dietary box and isn't lost on a re-send
        const same = (a: string, b: string | null | undefined) => a.toLowerCase() === (b ?? "").toLowerCase();
        setDietary((d) => {
          const next = { ...d };
          for (const g of result.added) {
            const typed = newPlusOnes.find((t) => same(t.first_name, g.first_name) && same(t.last_name ?? "", g.last_name));
            if (typed?.dietary_notes) next[g.id] = typed.dietary_notes;
          }
          return next;
        });
        addPlusOnes(result.added);
      }
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    const anyYes = Object.values(choices).includes("yes");
    return (
      <div className="rounded-md border bg-card p-8 text-center">
        <PartyPopper className="mx-auto size-8 text-muted-foreground" />
        <h2 className="mt-3 text-2xl font-light tracking-wide">Thank you, {partyFirstNames(members)}!</h2>
        <p className="mt-2 text-muted-foreground">
          {anyYes ? "We can't wait to celebrate with you." : "We'll miss you, and thank you for letting us know."}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          For the schedule, travel, places to stay and our gift list, visit{" "}
          <a href={WEDDING_SITE_URL} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">
            our wedding website
          </a>
          .
        </p>
        {party.deadline && !locked ? (
          <p className="mt-4 text-sm text-muted-foreground">
            You can change your answers until {formatDeadline(party.deadline)}.
          </p>
        ) : null}
        {!locked && (
          <Button variant="outline" className="mt-6 rounded-full" onClick={() => setDone(false)}>
            Change my answers
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-md border bg-card p-6 text-center">
        <h2 className="text-2xl font-light tracking-wide">
          Hello {partyGreeting(members)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {locked
            ? "Thank you for helping us plan. Here is what we have for you."
            : party.deadline
              ? `Please let us know whether you can join us by ${formatDeadline(party.deadline)}. You can come back to this link and change your answer until then.`
              : "Please let us know whether you can join us. You can come back to this link and change your answer any time."}
        </p>
        {party.deadline && !locked && daysUntil(party.deadline) <= 7 && (
          <p className="mt-2 text-sm font-medium text-foreground">
            {daysUntil(party.deadline) === 0 ? "Last day to RSVP!" : `Only ${daysUntil(party.deadline)} day${daysUntil(party.deadline) === 1 ? "" : "s"} left to reply.`}
          </p>
        )}
        {locked && party.deadline && (
          <p className="mt-3 rounded-md border bg-secondary px-3 py-2 text-sm">
            RSVPs closed on {formatDeadline(party.deadline)}. To change your answer, please contact us directly.
          </p>
        )}
      </div>

      <section className="rounded-md border bg-card p-6 text-center">
        <div className="grid gap-1.5 text-sm text-muted-foreground">
          {summary.venues.length > 0 && (
            <p className="flex items-center justify-center gap-1.5 font-medium text-foreground">
              <MapPin className="size-4 shrink-0" /> {summary.venues.join(" · ")}
            </p>
          )}
          {summary.dates.length > 0 && (
            <p className="flex items-center justify-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" /> {summary.dates.join(" · ")}
            </p>
          )}
        </div>
        <p className="mt-3 text-base font-medium sm:text-lg sm:tracking-wide">
          <EventNames names={summary.names} />
        </p>
        {summary.dressCodes.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">Dress code: {summary.dressCodes.join(" · ")}</p>
        )}
      </section>

      <section className="rounded-md border bg-card p-6">
        <h3 className="text-lg font-medium tracking-wide">Will you be joining us?</h3>
        <div className="mt-4 grid gap-5">
          {party.events.map((event) => {
            const attendees = members.filter((m) => invited(m.id, event.id));
            // One guest: the event name sits on the answer row itself. A party
            // gets the event name as a small heading with a row per person.
            const solo = members.length === 1;
            return (
              <div key={event.id} className="grid gap-2">
                {!solo && <div className="text-sm font-medium text-muted-foreground">{event.name}</div>}
                {attendees.map((m) => {
                  const key = `${m.id}:${event.id}`;
                  return (
                    <div key={m.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{solo ? event.name : guestFullName(m)}</span>
                      <div className="flex gap-2">
                        <ChoiceButton
                          active={choices[key] === "yes"}
                          disabled={locked}
                          tone="yes"
                          onClick={() => setChoices((c) => ({ ...c, [key]: "yes" }))}
                        >
                          <Check className="size-4" /> Accept
                        </ChoiceButton>
                        <ChoiceButton
                          active={choices[key] === "no"}
                          disabled={locked}
                          tone="no"
                          onClick={() => setChoices((c) => ({ ...c, [key]: "no" }))}
                        >
                          <X className="size-4" /> Decline
                        </ChoiceButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {openSlots > 0 && !locked && (
        <section className="rounded-md border bg-card p-6">
          <h3 className="text-lg font-medium tracking-wide">{openSlots === 1 ? "Bringing a plus-one?" : "Bringing guests?"}</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Add their name and they&apos;ll be included on your invitation, at the same events you&apos;re attending. Leave
            this blank if you&apos;re coming on your own.
          </p>
          <div className="grid gap-3">
            {plusOnes.slice(0, openSlots).map((p, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <Input
                  value={p.first}
                  placeholder="First name"
                  aria-label={openSlots === 1 ? "Plus-one first name" : `Guest ${i + 1} first name`}
                  onChange={(e) => setPlusOnes((cur) => cur.map((x, j) => (j === i ? { ...x, first: e.target.value } : x)))}
                />
                <Input
                  value={p.last}
                  placeholder="Last name"
                  aria-label={openSlots === 1 ? "Plus-one last name" : `Guest ${i + 1} last name`}
                  onChange={(e) => setPlusOnes((cur) => cur.map((x, j) => (j === i ? { ...x, last: e.target.value } : x)))}
                />
                {/* Once they have a name, they can also say what they can't eat. */}
                {p.first.trim() && (
                  <Textarea
                    className="col-span-2"
                    rows={2}
                    value={p.diet}
                    placeholder={`Dietary requirements for ${p.first.trim()} (optional)`}
                    aria-label={`Dietary requirements for ${p.first.trim()}`}
                    onChange={(e) => setPlusOnes((cur) => cur.map((x, j) => (j === i ? { ...x, diet: e.target.value } : x)))}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-md border bg-card p-6">
        <h3 className="text-lg font-medium tracking-wide">Dietary requirements</h3>
        <div className="mt-3 grid gap-3">
          {members.map((m) => (
            <div key={m.id} className="grid gap-1.5">
              {members.length > 1 && <span className="text-sm font-medium">{guestFullName(m)}</span>}
              <Textarea
                rows={2}
                disabled={locked}
                value={dietary[m.id] ?? ""}
                onChange={(e) => setDietary((d) => ({ ...d, [m.id]: e.target.value }))}
                placeholder="Allergies, vegetarian, halal..."
              />
            </div>
          ))}
        </div>
      </section>

      {!locked && (
        <Button size="lg" className="h-12 rounded-full text-base tracking-wide" disabled={saving || unanswered} onClick={handleSubmit}>
          {saving ? "Sending..." : unanswered ? "Please answer every event" : "Send my RSVP"}
        </Button>
      )}
    </div>
  );
}

function ChoiceButton({
  active,
  tone,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  tone: "yes" | "no";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all active:scale-95",
        active && tone === "yes" && "border-[#3a3a3a] bg-[#3a3a3a] text-[#ffffec]",
        active && tone === "no" && "border-[#777150] bg-[#777150] text-[#ffffec]",
        !active && "bg-transparent text-muted-foreground hover:bg-secondary",
        disabled && "cursor-default opacity-60 hover:bg-transparent"
      )}
    >
      {children}
    </button>
  );
}
