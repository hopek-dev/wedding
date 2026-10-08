"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Check, MapPin, PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitRsvp, type RsvpParty } from "@/app/actions/rsvp";
import { formatDateTime } from "@/lib/format";
import { daysUntil, formatDeadline } from "@/lib/rsvp-deadline";
import { WEDDING_SITE_URL } from "@/lib/site";
import { guestFullName } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Choice = "yes" | "no" | undefined;

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
  const [plusOneName, setPlusOneName] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const locked = party.closed;

  const invited = (guestId: string, eventId: string) => {
    const r = rsvpOf(guestId, eventId);
    return !!r && r.status !== "not_invited";
  };

  const unanswered = party.members.some((m) =>
    party.events.some((e) => invited(m.id, e.id) && !choices[`${m.id}:${e.id}`])
  );

  async function handleSubmit() {
    if (preview) {
      toast.info("This is a preview, so replies aren't saved.");
      setDone(true);
      return;
    }
    setSaving(true);
    try {
      const answers = party.members.flatMap((m) =>
        party.events
          .filter((e) => invited(m.id, e.id) && choices[`${m.id}:${e.id}`])
          .map((e) => ({
            guest_id: m.id,
            event_id: e.id,
            attending: choices[`${m.id}:${e.id}`] === "yes",
            dietary_notes: dietary[m.id],
          }))
      );
      const result = await submitRsvp({ token, answers, newPlusOneName: plusOneName });
      if (!result.ok) {
        toast.error(result.error);
        return;
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
        <h2 className="mt-3 text-2xl font-light tracking-wide">Thank you, {party.guest.first_name}!</h2>
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
          Hello {[party.guest.title, party.guest.first_name].filter(Boolean).join(" ")}
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
            {daysUntil(party.deadline) === 0 ? "Last day to reply!" : `Only ${daysUntil(party.deadline)} day${daysUntil(party.deadline) === 1 ? "" : "s"} left to reply.`}
          </p>
        )}
        {locked && party.deadline && (
          <p className="mt-3 rounded-md border bg-secondary px-3 py-2 text-sm">
            RSVPs closed on {formatDeadline(party.deadline)}. To change your answer, please contact us directly.
          </p>
        )}
      </div>

      {party.events.map((event) => (
        <section key={event.id} className="rounded-md border bg-card p-6">
          <h3 className="text-lg font-medium tracking-wide">{event.name}</h3>
          <div className="mt-1 grid gap-0.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> {formatDateTime(event.starts_at)}
            </span>
            {event.venue_name && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {event.venue_name}
                {event.address ? `, ${event.address}` : ""}
              </span>
            )}
            {event.dress_code && <span>Dress code: {event.dress_code}</span>}
          </div>
          <div className="mt-4 grid gap-3">
            {party.members
              .filter((m) => invited(m.id, event.id))
              .map((m) => {
                const key = `${m.id}:${event.id}`;
                return (
                  <div key={m.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{guestFullName(m)}</span>
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
        </section>
      ))}

      {party.openPlusOneSlots > 0 && !locked && (
        <section className="rounded-md border bg-card p-6">
          <h3 className="text-lg font-medium tracking-wide">Bringing a plus-one?</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            They&apos;ll be added to the same events you&apos;re attending.
          </p>
          <Input value={plusOneName} onChange={(e) => setPlusOneName(e.target.value)} placeholder="Their full name" disabled={locked} />
        </section>
      )}

      <section className="rounded-md border bg-card p-6">
        <h3 className="text-lg font-medium tracking-wide">Dietary requirements</h3>
        <div className="mt-3 grid gap-3">
          {party.members.map((m) => (
            <div key={m.id} className="grid gap-1.5">
              {party.members.length > 1 && <span className="text-sm font-medium">{guestFullName(m)}</span>}
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
