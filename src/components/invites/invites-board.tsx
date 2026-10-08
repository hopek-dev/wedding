"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, ListChecks, MessageCircle, RotateCcw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { markInviteSent } from "@/app/actions/invites";
import { DeadlineCard } from "@/components/invites/deadline-card";
import { formatDeadline } from "@/lib/rsvp-deadline";
import { formatDate } from "@/lib/format";
import { guestFullName, type Guest, type GuestRsvp, type WeddingEvent } from "@/lib/supabase/types";
import {
  DEFAULT_INVITE_TEMPLATE,
  DEFAULT_REMINDER_TEMPLATE,
  TEMPLATE_KEY,
  formatPhone,
  isLocalOrigin,
  normalizePhone,
  renderTemplate,
  rsvpUrl,
  siteOrigin,
  whatsappLink,
} from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Stage = "not_sent" | "awaiting" | "responded";
type Filter = "all" | Stage | "no_phone" | "no_events";

interface Row {
  guest: Guest;
  phone: string | null;
  invitedEvents: WeddingEvent[];
  plusOnes: Guest[];
  accepted: number;
  declined: number;
  stage: Stage;
}

// Message templates live in localStorage, read through useSyncExternalStore so
// the server render and first client render agree (defaults) before hydration.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};
const readRaw = () => {
  try {
    return localStorage.getItem(TEMPLATE_KEY) ?? "";
  } catch {
    return "";
  }
};

function useTemplates() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const saved = useMemo(() => {
    try {
      return JSON.parse(raw || "null") ?? {};
    } catch {
      return {};
    }
  }, [raw]);
  const invite: string = saved.invite ?? DEFAULT_INVITE_TEMPLATE;
  const reminder: string = saved.reminder ?? DEFAULT_REMINDER_TEMPLATE;

  const write = (patch: { invite?: string; reminder?: string }) => {
    try {
      localStorage.setItem(TEMPLATE_KEY, JSON.stringify({ invite, reminder, ...patch }));
    } catch {}
    listeners.forEach((cb) => cb());
  };
  return {
    invite,
    reminder,
    setInvite: (v: string) => write({ invite: v }),
    setReminder: (v: string) => write({ reminder: v }),
  };
}

const stageStyle: Record<Stage, string> = {
  not_sent: "bg-muted text-muted-foreground",
  awaiting: "bg-amber-500/15 text-amber-400",
  responded: "bg-emerald-500/15 text-emerald-400",
};

export function InvitesBoard({
  events,
  guests,
  rsvps,
  deadline,
}: {
  events: WeddingEvent[];
  guests: Guest[];
  rsvps: GuestRsvp[];
  deadline: string | null;
}) {
  const router = useRouter();
  const templates = useTemplates();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"invite" | "reminder">("invite");
  const [queue, setQueue] = useState<Row[] | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const origin = useSyncExternalStore(
    () => () => {},
    siteOrigin,
    () => ""
  );
  // WhatsApp only turns a link into a tappable one when it is a public address.
  // localhost, 192.168.x.x and the like stay as plain, unclickable text.
  const localWarning = origin !== "" && isLocalOrigin(origin);
  const [allowLocal, setAllowLocal] = useState(false);
  const blocked = localWarning && !allowLocal;

  // Plus-ones answer through their host's link, so they aren't invitees themselves.
  const rows: Row[] = useMemo(
    () =>
      guests
        .filter((g) => !g.plus_one_of)
        .map((guest) => {
          const mine = rsvps.filter((r) => r.guest_id === guest.id && r.status !== "not_invited");
          return {
            guest,
            phone: normalizePhone(guest.phone),
            plusOnes: guests.filter((g) => g.plus_one_of === guest.id),
            invitedEvents: events.filter((e) => mine.some((r) => r.event_id === e.id)),
            accepted: mine.filter((r) => r.status === "confirmed").length,
            declined: mine.filter((r) => r.status === "declined").length,
            stage: guest.rsvp_responded_at ? "responded" : guest.invite_sent_at ? "awaiting" : "not_sent",
          } satisfies Row;
        }),
    [guests, rsvps, events]
  );

  const ready = (r: Row) => !!r.phone && r.invitedEvents.length > 0 && !blocked;
  const counts = {
    total: rows.length,
    plusOnes: guests.length - rows.length,
    not_sent: rows.filter((r) => r.stage === "not_sent").length,
    awaiting: rows.filter((r) => r.stage === "awaiting").length,
    responded: rows.filter((r) => r.stage === "responded").length,
    no_phone: rows.filter((r) => !r.phone).length,
    no_events: rows.filter((r) => r.invitedEvents.length === 0).length,
  };
  const sendable = rows.filter((r) => r.stage === "not_sent" && ready(r));
  const remindable = rows.filter((r) => r.stage === "awaiting" && ready(r));

  const q = query.trim().toLowerCase();
  const shown = rows.filter((r) => {
    if (q && !guestFullName(r.guest).toLowerCase().includes(q)) return false;
    if (filter === "all") return true;
    if (filter === "no_phone") return !r.phone;
    if (filter === "no_events") return r.invitedEvents.length === 0;
    return r.stage === filter;
  });

  function messageFor(r: Row) {
    const template = r.stage === "awaiting" ? templates.reminder : templates.invite;
    return renderTemplate(template, {
      first_name: r.guest.first_name,
      full_name: guestFullName(r.guest),
      link: rsvpUrl(r.guest.rsvp_token),
      deadline: deadline ? formatDeadline(deadline) : undefined,
    });
  }

  // Opens WhatsApp with the message ready to send. window.open has to run
  // synchronously inside the click handler or browsers block it as a popup.
  function send(r: Row) {
    if (!r.phone) return;
    window.open(whatsappLink(r.phone, messageFor(r)), "_blank", "noopener,noreferrer");
    markInviteSent(r.guest.id, "whatsapp")
      .then(() => router.refresh())
      .catch(() => toast.error("Opened WhatsApp, but couldn't record it as sent."));
  }

  async function copyMessage(r: Row) {
    try {
      await navigator.clipboard.writeText(messageFor(r));
      toast.success("Message copied");
    } catch {
      toast.error("Couldn't copy the message");
    }
  }

  function startQueue(list: Row[]) {
    if (list.length === 0) return;
    setQueue(list);
    setQueueIndex(0);
  }

  const current = queue?.[queueIndex];

  const filters: Array<[Filter, string, number]> = [
    ["all", "Everyone", counts.total],
    ["not_sent", "Not sent", counts.not_sent],
    ["awaiting", "Awaiting reply", counts.awaiting],
    ["responded", "Responded", counts.responded],
    ["no_phone", "No valid phone", counts.no_phone],
    ["no_events", "Not invited to an event", counts.no_events],
  ];

  return (
    <div className="grid gap-6">
      {localWarning && (
        <div className="grid gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>The invitation link wouldn&apos;t be tappable in WhatsApp.</strong> You&apos;re on{" "}
              <strong>{origin}</strong>, which only exists on this computer. WhatsApp only makes a link clickable when it
              is a public <code>https://</code> address, and guests couldn&apos;t open this one anyway. Deploy the app, set{" "}
              <code>NEXT_PUBLIC_SITE_URL</code> to the live address (e.g. <code>https://your-site.vercel.app</code>), and
              restart. Sending is switched off until then.
            </p>
          </div>
          <label className="ml-6 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={allowLocal} onChange={(e) => setAllowLocal(e.target.checked)} />
            Switch sending back on, just to test the message (the link will not work for guests)
          </label>
        </div>
      )}

      <DeadlineCard deadline={deadline} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Not sent", counts.not_sent, "text-foreground"],
          ["Awaiting reply", counts.awaiting, "text-amber-400"],
          ["Responded", counts.responded, "text-emerald-400"],
          ["Invitees", counts.total, "text-muted-foreground"],
        ].map(([label, value, tone]) => (
          <Card key={label as string} size="sm">
            <CardContent>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className={cn("text-2xl font-semibold tabular-nums", tone as string)}>{value}</div>
              {label === "Invitees" && counts.plusOnes > 0 && (
                <div className="text-xs text-muted-foreground">
                  +{counts.plusOnes} plus-one{counts.plusOnes === 1 ? "" : "s"} on their host&apos;s link
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={sendable.length === 0} onClick={() => startQueue(sendable)}>
          <ListChecks className="size-4" />
          Send invites ({sendable.length})
        </Button>
        <Button variant="outline" disabled={remindable.length === 0} onClick={() => startQueue(remindable)}>
          <RotateCcw className="size-4" />
          Remind non-responders ({remindable.length})
        </Button>
        {counts.no_events > 0 && (
          <p className="text-sm text-muted-foreground">
            {counts.no_events} guest{counts.no_events === 1 ? " isn't" : "s aren't"} invited to any event yet.{" "}
            <Link href="/guests" className="text-primary underline-offset-4 hover:underline">
              Invite them on the Guests page
            </Link>
            .
          </p>
        )}
      </div>

      <Card>
        <CardContent className="grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex rounded-lg bg-muted p-1">
              {(["invite", "reminder"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    tab === t ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "invite" ? "Invitation message" : "Reminder message"}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                tab === "invite"
                  ? templates.setInvite(DEFAULT_INVITE_TEMPLATE)
                  : templates.setReminder(DEFAULT_REMINDER_TEMPLATE)
              }
            >
              Reset
            </Button>
          </div>
          <Textarea
            rows={5}
            value={tab === "invite" ? templates.invite : templates.reminder}
            onChange={(e) => (tab === "invite" ? templates.setInvite(e.target.value) : templates.setReminder(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Use <code>{"{first_name}"}</code>, <code>{"{full_name}"}</code> and <code>{"{link}"}</code> (each guest&apos;s
            personal RSVP link) <code>{"{deadline}"}</code> (the RSVP deadline above) and <code>{"{website}"}</code> (your wedding website). Keep <code>{"{link}"}</code> on
            its own line so WhatsApp makes it tappable. Saved in this browser.
          </p>
          <a
            href="/rsvp/preview"
            target="_blank"
            rel="noreferrer"
            className="w-fit text-sm text-primary underline-offset-4 hover:underline"
          >
            Preview the envelope and invitation your guests see
          </a>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                filter === key ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {label} <span className="tabular-nums opacity-70">{n}</span>
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-56">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search guests" className="pl-8" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="stack-table">
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>WhatsApp number</TableHead>
                <TableHead>Invited to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[170px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r) => (
                <TableRow key={r.guest.id}>
                  <TableCell data-span="full" className="font-medium">
                    {[r.guest.title, guestFullName(r.guest)].filter(Boolean).join(" ")}
                    {r.guest.tag && (
                      <Badge variant="outline" className="ml-2 font-normal">
                        {r.guest.tag}
                      </Badge>
                    )}
                    {r.plusOnes.map((p) => (
                      <Badge key={p.id} variant="secondary" className="mt-1 mr-1 block font-normal">
                        +1 {guestFullName(p)}
                      </Badge>
                    ))}
                    {r.plusOnes.length === 0 && r.guest.plus_ones_allowed > 0 && (
                      <Badge variant="outline" className="mt-1 block font-normal text-muted-foreground">
                        +{r.guest.plus_ones_allowed} allowed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell data-label="WhatsApp number">
                    {r.phone ? (
                      <span className="tabular-nums">{formatPhone(r.phone)}</span>
                    ) : (
                      <span className="text-destructive">{r.guest.phone ? `Can't read "${r.guest.phone}"` : "Missing"}</span>
                    )}
                  </TableCell>
                  <TableCell data-label="Invited to" className="text-muted-foreground">
                    {r.invitedEvents.length ? r.invitedEvents.map((e) => e.name).join(", ") : "None yet"}
                  </TableCell>
                  <TableCell data-label="Status">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", stageStyle[r.stage])}>
                      {r.stage === "responded" && <Check className="size-3" />}
                      {r.stage === "not_sent" && "Not sent"}
                      {r.stage === "awaiting" && "Sent"}
                      {r.stage === "responded" && `${r.accepted} yes · ${r.declined} no`}
                    </span>
                    {r.stage === "awaiting" && r.guest.invite_sent_at && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(r.guest.invite_sent_at)}</div>
                    )}
                  </TableCell>
                  <TableCell data-span="full">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant={r.stage === "not_sent" ? "default" : "outline"}
                        disabled={!ready(r)}
                        title={
                          blocked
                            ? "Set your public site address first, otherwise the link won't be tappable in WhatsApp"
                            : !r.phone
                              ? "Add a valid phone number first"
                              : !r.invitedEvents.length
                                ? "Invite them to an event first"
                                : undefined
                        }
                        onClick={() => send(r)}
                      >
                        <MessageCircle className="size-3.5" />
                        {r.stage === "not_sent" ? "Send" : r.stage === "awaiting" ? "Remind" : "Resend"}
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" title="Copy message" onClick={() => copyMessage(r)}>
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {rows.length === 0 ? "No guests yet. Import your list on the Guests page." : "No guests match this view."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={queue !== null} onOpenChange={(next) => !next && setQueue(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {current ? `Sending ${queueIndex + 1} of ${queue?.length}` : "All done"}
            </DialogTitle>
          </DialogHeader>
          {current ? (
            <div className="grid gap-3">
              <div>
                <div className="text-lg font-medium">{guestFullName(current.guest)}</div>
                <div className="text-sm text-muted-foreground tabular-nums">{current.phone && formatPhone(current.phone)}</div>
              </div>
              {/* The card WhatsApp shows under the link, generated with this guest's name. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/rsvp/${current.guest.rsvp_token}/opengraph-image`}
                alt={`Invitation card for ${guestFullName(current.guest)}`}
                className="w-full rounded-md border"
                style={{ aspectRatio: "1200 / 630" }}
              />
              <Textarea readOnly rows={8} value={messageFor(current)} className="text-sm" />
              <p className="text-xs text-muted-foreground">
                WhatsApp opens with this message ready. Press Send there, come back here, and the next guest is waiting.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">You&apos;ve been through everyone in this batch.</p>
          )}
          <DialogFooter>
            {current ? (
              <>
                <Button variant="ghost" onClick={() => setQueueIndex((i) => i + 1)}>
                  Skip
                </Button>
                <Button
                  onClick={() => {
                    send(current);
                    setQueueIndex((i) => i + 1);
                  }}
                >
                  <MessageCircle className="size-4" />
                  Open WhatsApp
                </Button>
              </>
            ) : (
              <Button onClick={() => setQueue(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
