"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createTable, deleteTable, saveEventSeating, updateTable } from "@/app/actions/seating";
import type { Guest, GuestRsvp, SeatAssignment, SeatingTable, WeddingEvent } from "@/lib/supabase/types";
import {
  DEFAULT_SEATS,
  PILL_H,
  PILL_W,
  SEAT_OPTIONS,
  autoSeat,
  buildPlanGuests,
  buildPlans,
  emptySeats,
  geom,
  locate,
  place,
  resizeTable,
  rotateTable,
  seatRows,
  type Dest,
  type PlanGuest,
  type PlanTable,
} from "@/lib/seating-plan";
import { fraunces, instrumentSans } from "./fonts";
import "./seating.css";

interface TableApi {
  rename: (id: string, name: string) => void;
  commitName: (id: string) => void;
  resize: (id: string, n: number) => void;
  rotate: (id: string, dir: 1 | -1) => void;
  remove: (id: string) => void;
}

const hueStyle = (g: PlanGuest) =>
  g.hue === null ? undefined : ({ "--h": g.hue, "--s": "var(--pill-s)" } as CSSProperties);

function Pill({
  g,
  selected,
  query,
  where,
}: {
  g: PlanGuest;
  selected: boolean;
  query: string;
  where: string;
}) {
  const match = query ? (g.name.toLowerCase().includes(query) ? " hit" : " dim") : "";
  return (
    <div
      className={`pill${g.hue === null ? " neutral" : ""}${selected ? " sel-on" : ""}${match}`}
      data-g={g.id}
      title={`${g.name} (${where})`}
      style={hueStyle(g)}
    >
      <b>{g.first}</b>
      <i>{g.last}</i>
    </div>
  );
}

function Table({
  table,
  guests,
  selected,
  query,
  api,
  avail,
  onlyOne,
}: {
  table: PlanTable;
  guests: Map<string, PlanGuest>;
  selected: string | null;
  query: string;
  api: TableApi;
  avail: number;
  onlyOne: boolean;
}) {
  const n = table.seats.length;
  const G = geom(n);
  const filled = table.seats.filter((x) => x !== null).length;
  const full = filled === n;
  const scale = Math.max(0.72, Math.min(1, avail / G.size));
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const k = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(k);
  }, [armed]);

  return (
    <div className="tbl">
      <div className="scroller">
        <div className="scaler" style={{ width: G.size * scale, height: G.size * scale }}>
          <div className="floor" style={{ width: G.size, height: G.size, transform: `scale(${scale})` }}>
            <div
              className={`linen${full ? " full" : ""}`}
              data-table={table.id}
              style={{ left: G.c - G.linen / 2, top: G.c - G.linen / 2, width: G.linen, height: G.linen }}
            >
              <h3>{table.name}</h3>
              <div className="count">
                {filled} / {n}
                {full ? " full" : ""}
              </div>
            </div>
            {table.seats.map((id, s) => {
              const a = ((s + 0.5) * 2 * Math.PI) / n;
              const x = G.c + G.r * Math.sin(a) - PILL_W / 2;
              const y = G.c - G.r * Math.cos(a) - PILL_H / 2;
              const g = id !== null ? guests.get(id) : undefined;
              return (
                <div
                  key={s}
                  className={`seat${g ? " taken" : ""}`}
                  data-seat=""
                  data-t={table.id}
                  data-s={s}
                  style={{ left: x, top: y }}
                >
                  {g ? (
                    <Pill g={g} selected={selected === g.id} query={query} where={`${table.name}, seat ${s + 1}`} />
                  ) : (
                    s + 1
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="tbar">
        <input
          value={table.name}
          maxLength={24}
          aria-label="Table name"
          onChange={(e) => api.rename(table.id, e.target.value)}
          onBlur={() => api.commitName(table.id)}
        />
        <select value={n} aria-label={`Seats at ${table.name}`} onChange={(e) => api.resize(table.id, +e.target.value)}>
          {SEAT_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o} seats
            </option>
          ))}
        </select>
        <span className="sep" />
        <button className="btn sm" type="button" title="Rotate guests counter-clockwise" aria-label="Rotate counter-clockwise" onClick={() => api.rotate(table.id, -1)}>
          ↺
        </button>
        <button className="btn sm" type="button" title="Rotate guests clockwise" aria-label="Rotate clockwise" onClick={() => api.rotate(table.id, 1)}>
          ↻
        </button>
        <button
          className={`btn sm${armed ? " armed" : ""}`}
          type="button"
          disabled={onlyOne}
          onClick={() => {
            if (armed) {
              setArmed(false);
              api.remove(table.id);
            } else setArmed(true);
          }}
        >
          {armed ? "Remove?" : "Remove"}
        </button>
      </div>
    </div>
  );
}

function ConfirmButton({
  label,
  armedLabel,
  onConfirm,
  disabled,
}: {
  label: string;
  armedLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const k = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(k);
  }, [armed]);
  return (
    <button
      className={`btn${armed ? " armed" : ""}`}
      type="button"
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? armedLabel : label}
    </button>
  );
}

export function SeatingBoard({
  events,
  guests,
  rsvps,
  initialTables,
  initialAssignments,
}: {
  events: WeddingEvent[];
  guests: Guest[];
  rsvps: GuestRsvp[];
  initialTables: SeatingTable[];
  initialAssignments: SeatAssignment[];
}) {
  const planGuests = useMemo(() => buildPlanGuests(guests), [guests]);
  const nameOf = useCallback((id: string) => planGuests.get(id)?.name ?? "Guest", [planGuests]);

  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [plans, setPlans] = useState(() => buildPlans(initialTables, initialAssignments));
  const [defSeats, setDefSeats] = useState(DEFAULT_SEATS);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [mainW, setMainW] = useState(0);
  const [copyText, setCopyText] = useState<string | null>(null);
  const [trayOpen, setTrayOpen] = useState(true);
  const [showAll, setShowAll] = useState<boolean | null>(null);

  const mainRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());

  const plan = useMemo(() => plans[eventId] ?? [], [plans, eventId]);
  const live = useRef({ plan, selected, eventId });
  useEffect(() => {
    live.current = { plan, selected, eventId };
  });

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  }, []);

  // Saves run one after another so a slow request can never overwrite a newer plan.
  const enqueue = useCallback(
    (job: () => Promise<unknown>) => {
      saveChain.current = saveChain.current.then(job).catch(() => toast("Couldn't save your changes. Refresh and try again."));
    },
    [toast]
  );

  const commit = useCallback(
    (next: PlanTable[], opts?: { saveSeats?: boolean }) => {
      const id = live.current.eventId;
      live.current.plan = next;
      setPlans((p) => ({ ...p, [id]: next }));
      if (opts?.saveSeats !== false) enqueue(() => saveEventSeating(id, seatRows(next)));
    },
    [enqueue]
  );

  const doPlace = useCallback(
    (id: string, dest: Dest) => {
      const r = place(live.current.plan, id, dest, nameOf);
      if (r.ok) commit(r.tables);
      if (r.msg) toast(r.msg);
      return r.ok;
    },
    [commit, nameOf, toast]
  );

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const set = () => setMainW(el.clientWidth);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ----- guests for the current event -----
  const statusOf = (guestId: string) =>
    rsvps.find((r) => r.guest_id === guestId && r.event_id === eventId)?.status ?? "not_invited";
  const anyInvited = guests.some((g) => ["invited", "confirmed"].includes(statusOf(g.id)));
  const everyone = showAll ?? !anyInvited;
  const seatedIds = new Set(plan.flatMap((t) => t.seats.filter((x): x is string => x !== null)));
  const eligible = guests.filter((g) => {
    const s = statusOf(g.id);
    return seatedIds.has(g.id) || (s !== "declined" && (everyone || s === "invited" || s === "confirmed"));
  });
  const q = query.trim().toLowerCase();
  const unseated = eligible
    .filter((g) => !seatedIds.has(g.id))
    .map((g) => planGuests.get(g.id)!)
    .sort((a, b) => a.name.localeCompare(b.name));
  const shown = q ? unseated.filter((g) => g.name.toLowerCase().includes(q)) : unseated;
  const capTotal = plan.reduce((a, t) => a + t.seats.length, 0);
  const uniform = plan.length > 0 && plan.every((t) => t.seats.length === plan[0].seats.length) ? plan[0].seats.length : null;
  const selLoc = selected !== null ? locate(plan, selected) : null;

  // ----- table actions -----
  const api: TableApi = useMemo(
    () => ({
      rename: (id, name) => commit(live.current.plan.map((t) => (t.id === id ? { ...t, name } : t)), { saveSeats: false }),
      commitName: (id) => {
        const t = live.current.plan.find((x) => x.id === id);
        if (t && t.name.trim()) enqueue(() => updateTable(id, { name: t.name.trim() }));
      },
      resize: (id, n) => {
        let lost = 0;
        const next = live.current.plan.map((t) => {
          if (t.id !== id) return t;
          const r = resizeTable(t, n);
          lost = r.lost;
          return r.table;
        });
        commit(next);
        enqueue(() => updateTable(id, { capacity: n }));
        if (lost) toast(`${lost} guest${lost > 1 ? "s" : ""} moved to unseated.`);
      },
      rotate: (id, dir) => commit(live.current.plan.map((t) => (t.id === id ? rotateTable(t, dir) : t))),
      remove: (id) => {
        const t = live.current.plan.find((x) => x.id === id);
        if (!t) return;
        const k = t.seats.filter((x) => x !== null).length;
        commit(live.current.plan.filter((x) => x.id !== id), { saveSeats: false });
        enqueue(() => deleteTable(id));
        toast(`${t.name} removed${k ? `; ${k} guest${k > 1 ? "s" : ""} moved to unseated.` : "."}`);
      },
    }),
    [commit, enqueue, toast]
  );

  async function addTable() {
    const nums = live.current.plan.map((t) => Number(t.name.match(/^Table (\d+)$/)?.[1] ?? 0));
    const name = `Table ${Math.max(0, ...nums) + 1}`;
    try {
      const created = await createTable({ event_id: eventId, name, shape: "round", capacity: defSeats, x: 50, y: 50 });
      const base = live.current.plan;
      commit([...base, { id: created.id, name, seats: emptySeats(defSeats) }], { saveSeats: false });
      toast("Table added at the end.");
    } catch {
      toast("Couldn't add the table.");
    }
  }

  function resizeAll(n: number) {
    let lost = 0;
    const next = live.current.plan.map((t) => {
      const r = resizeTable(t, n);
      lost += r.lost;
      return r.table;
    });
    commit(next);
    for (const t of next) enqueue(() => updateTable(t.id, { capacity: n }));
    toast(`All tables set to ${n} seats.${lost ? ` ${lost} guest${lost > 1 ? "s" : ""} moved to unseated.` : ""}`);
  }

  function listText() {
    const out: string[] = [];
    for (const t of plan) {
      const names = t.seats.filter((x): x is string => x !== null).map(nameOf);
      out.push(`${t.name} (${names.length}/${t.seats.length})`);
      names.forEach((n, i) => out.push(`  ${i + 1}. ${n}`));
      out.push("");
    }
    out.push(`Unseated (${unseated.length})`);
    unseated.forEach((g) => out.push(`  - ${g.name}`));
    return out.join("\n");
  }

  function copy() {
    const txt = listText();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(txt).then(() => toast("Seating list copied."), () => setCopyText(txt));
    } else setCopyText(txt);
  }

  // ----- drag + click interaction, wired once and reading live state -----
  useEffect(() => {
    type Drag = {
      id: string;
      el: HTMLElement;
      sx: number;
      sy: number;
      on: boolean;
      ghost: HTMLElement | null;
      target: { el: Element; dest: Dest } | null;
    };
    let drag: Drag | null = null;
    let suppress = false;

    const seatTarget = (seat: HTMLElement) => ({
      el: seat as Element,
      dest: { type: "seat", t: seat.dataset.t!, s: Number(seat.dataset.s) } as Dest,
    });
    const nearestSeat = (floor: Element, x: number, y: number) => {
      let best: HTMLElement | null = null;
      let bd = Infinity;
      floor.querySelectorAll<HTMLElement>("[data-seat]").forEach((s) => {
        const r = s.getBoundingClientRect();
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (d < bd) {
          bd = d;
          best = s;
        }
      });
      return best as HTMLElement | null;
    };
    const targetAt = (x: number, y: number, gid: string) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const seat = el.closest<HTMLElement>("[data-seat]");
      if (seat) return seatTarget(seat);
      const fl = el.closest(".sp .floor");
      if (fl) {
        const lin = fl.querySelector<HTMLElement>("[data-table]")!;
        const tid = lin.dataset.table!;
        const here = locate(live.current.plan, gid);
        // Over the cloth: from this same table snap to the nearest seat, otherwise take the next free seat.
        if (el.closest("[data-table]") && !(here && here.t.id === tid)) {
          return { el: lin as Element, dest: { type: "table", t: tid } as Dest };
        }
        const near = nearestSeat(fl, x, y);
        return near ? seatTarget(near) : null;
      }
      if (el.closest("#sp-pool, .sp .side")) {
        return { el: document.getElementById("sp-pool") as Element, dest: { type: "pool" } as Dest };
      }
      return null;
    };
    const clearOver = () => document.querySelectorAll(".sp .over").forEach((e) => e.classList.remove("over"));

    const down = (e: PointerEvent) => {
      const t = e.target as Element;
      const el = t.closest<HTMLElement>(".sp [data-g]");
      if (!el) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.pointerType !== "mouse" && el.classList.contains("chip") && !t.closest(".grip")) return;
      drag = { id: el.dataset.g!, el, sx: e.clientX, sy: e.clientY, on: false, ghost: null, target: null };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      if (!drag.on) {
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
        drag.on = true;
        const gh = document.createElement("div");
        gh.className = "sp-ghost";
        gh.textContent = planGuests.get(drag.id)?.name ?? "";
        document.body.appendChild(gh);
        drag.ghost = gh;
        drag.el.classList.add("lifted");
        document.body.classList.add("sp-dragging");
      }
      e.preventDefault();
      drag.ghost!.style.transform = `translate(${e.clientX + 14}px,${e.clientY + 14}px)`;
      const tray = document.querySelector<HTMLElement>(".sp .side");
      let floorBottom = window.innerHeight;
      if (tray && getComputedStyle(tray).position === "fixed") floorBottom = tray.getBoundingClientRect().top;
      if (e.clientY < 70) window.scrollBy(0, -14);
      else if (e.clientY > floorBottom - 70 && e.clientY < floorBottom) window.scrollBy(0, 14);
      clearOver();
      drag.target = targetAt(e.clientX, e.clientY, drag.id);
      drag.target?.el.classList.add("over");
    };
    const end = (commitDrop: boolean) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.on) return;
      suppress = true;
      setTimeout(() => (suppress = false), 0);
      d.ghost?.remove();
      document.body.classList.remove("sp-dragging");
      clearOver();
      d.el.classList.remove("lifted");
      setSelected(null);
      if (commitDrop && d.target) doPlace(d.id, d.target.dest);
    };
    const up = () => end(true);
    const cancel = () => end(false);
    const click = (e: MouseEvent) => {
      if (suppress) return;
      const t = e.target as Element;
      if (!t.closest(".sp")) return;
      const sel = live.current.selected;
      const tbs = live.current.plan;
      const chip = t.closest<HTMLElement>(".chip");
      const seat = t.closest<HTMLElement>("[data-seat]");
      const tb = t.closest<HTMLElement>("[data-table]");
      if (chip) {
        const id = chip.dataset.g!;
        setSelected(sel === id ? null : id);
        return;
      }
      if (seat) {
        const table = tbs.find((x) => x.id === seat.dataset.t);
        if (!table) return;
        const s = Number(seat.dataset.s);
        const occ = table.seats[s];
        if (sel === null) {
          if (occ !== null) setSelected(occ);
          return;
        }
        if (occ === sel) {
          setSelected(null);
          return;
        }
        doPlace(sel, { type: "seat", t: table.id, s });
        setSelected(null);
        return;
      }
      if (tb && sel !== null) {
        if (doPlace(sel, { type: "table", t: tb.dataset.table! })) setSelected(null);
        return;
      }
      if (t.closest("#sp-pool") && sel !== null && locate(tbs, sel)) {
        doPlace(sel, { type: "pool" });
        setSelected(null);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    const noNative = (e: Event) => {
      if ((e.target as Element).closest?.(".sp [data-g]")) e.preventDefault();
    };

    document.addEventListener("dragstart", noNative);
    document.addEventListener("selectstart", noNative);
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("dragstart", noNative);
      document.removeEventListener("selectstart", noNative);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", cancel);
      document.removeEventListener("click", click);
      document.removeEventListener("keydown", key);
      document.body.classList.remove("sp-dragging");
      document.querySelectorAll(".sp-ghost").forEach((g) => g.remove());
    };
  }, [doPlace, planGuests]);

  if (events.length === 0) return <p className="text-sm text-muted-foreground">Add an event first.</p>;

  const selectedGuest = selected !== null ? planGuests.get(selected) : undefined;

  return (
    <div className={`sp ${fraunces.variable} ${instrumentSans.variable}`}>
      <div className="app">
        <header className="bar">
          <div className="title">
            <h1>Guest Seating Plan</h1>
            <p>
              Drag a guest onto any seat to move or swap, including seats on the same table. Or tap a guest, then tap a
              seat.
              <span className="hide-sm">
                {" "}
                Drop on a table for its next free seat, or on the Unseated list to remove a guest.
              </span>
            </p>
          </div>
          <div className="tools">
            <label className="field">
              All tables
              <select
                className="sel"
                value={uniform ?? ""}
                disabled={plan.length === 0}
                onChange={(e) => e.target.value && resizeAll(Number(e.target.value))}
              >
                {uniform === null && <option value="">Mixed</option>}
                {SEAT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o} seats
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              New table
              <select className="sel" value={defSeats} onChange={(e) => setDefSeats(Number(e.target.value))}>
                {SEAT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o} seats
                  </option>
                ))}
              </select>
            </label>
            <button className="btn primary" type="button" onClick={addTable}>
              + Add table
            </button>
            <ConfirmButton
              label="Auto-seat by family"
              armedLabel="Replace seating?"
              disabled={plan.length === 0}
              onConfirm={() => {
                const pool = eligible.map((g) => planGuests.get(g.id)!);
                commit(autoSeat(live.current.plan, pool));
                setSelected(null);
                toast("Guests grouped by family across the tables.");
              }}
            />
            <ConfirmButton
              label="Clear tables"
              armedLabel="Unseat everyone?"
              onConfirm={() => {
                commit(live.current.plan.map((t) => ({ ...t, seats: emptySeats(t.seats.length) })));
                setSelected(null);
              }}
            />
            <button className="btn" type="button" onClick={copy}>
              Copy seating list
            </button>
          </div>
        </header>

        <div className="events" role="tablist">
          {events.map((e) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={e.id === eventId}
              className={e.id === eventId ? "on" : ""}
              onClick={() => {
                setEventId(e.id);
                setSelected(null);
                setQuery("");
              }}
            >
              {e.name}
            </button>
          ))}
        </div>

        <div className="stats">
          <span>
            <b>{eligible.length}</b>guests
          </span>
          <span>
            <b>{seatedIds.size}</b>seated
          </span>
          <span>
            <b>{unseated.length}</b>unseated
          </span>
          <span>
            <b>{plan.length}</b>tables
          </span>
          <span>
            <b>{Math.max(0, capTotal - seatedIds.size)}</b>open seats of {capTotal}
          </span>
        </div>

        <div className={`selbar${selected !== null ? " on" : ""}`} aria-live="polite">
          {selectedGuest ? (
            <>
              <span>
                <b>{selectedGuest.name}</b>
                {selLoc ? ` at ${selLoc.t.name}, seat ${selLoc.s + 1}` : " is unseated"}. Click a seat or table to move.
                {selLoc ? " Click the unseated list to remove." : ""}
              </span>
              <button className="btn sm" type="button" onClick={() => setSelected(null)}>
                Cancel
              </button>
            </>
          ) : (
            "Nothing selected. Use the search box to find a guest on the floor."
          )}
        </div>

        <div className="layout">
          <aside className={`side${trayOpen ? "" : " tray-closed"}`}>
            <div className="side-head">
              <h2>
                Unseated <span>{unseated.length}</span>
              </h2>
              <button className="btn sm tray-toggle" type="button" aria-expanded={trayOpen} onClick={() => setTrayOpen(!trayOpen)}>
                {trayOpen ? "Hide" : "Show"}
              </button>
              <input
                className="search"
                type="search"
                placeholder="Find a guest"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {anyInvited && (
                <label className="field" style={{ fontSize: 12 }}>
                  <input type="checkbox" checked={everyone} onChange={(e) => setShowAll(e.target.checked)} />
                  Include guests not yet invited
                </label>
              )}
            </div>
            <div id="sp-pool">
              {unseated.length === 0 ? (
                <div className="empty-note">{eligible.length === 0 ? "No guests to seat yet." : "Everyone has a seat."}</div>
              ) : shown.length === 0 ? (
                <div className="empty-note">No unseated guest matches.</div>
              ) : (
                shown.map((g) => (
                  <div
                    key={g.id}
                    className={`chip${g.hue === null ? " neutral" : ""}${selected === g.id ? " sel-on" : ""}`}
                    data-g={g.id}
                    style={hueStyle(g)}
                  >
                    <span className="grip" />
                    <span className="nm">{g.name}</span>
                  </div>
                ))
              )}
            </div>
          </aside>

          <main className="floor-wrap" ref={mainRef}>
            {plan.length === 0 && (
              <div className="no-tables">No tables for this event yet. Choose a size above and press &ldquo;+ Add table&rdquo;.</div>
            )}
            {mainW > 0 &&
              plan.map((t) => (
                <Table
                  key={t.id}
                  table={t}
                  guests={planGuests}
                  selected={selected}
                  query={q}
                  api={api}
                  avail={mainW}
                  onlyOne={false}
                />
              ))}
          </main>
        </div>
      </div>

      <div className={`toast${toastMsg ? " show" : ""}`} role="status">
        {toastMsg}
      </div>
      {copyText !== null && (
        <div className="modal">
          <div className="box">
            <b>Seating list</b>
            <textarea readOnly defaultValue={copyText} autoFocus onFocus={(e) => e.target.select()} />
            <button className="btn primary" type="button" onClick={() => setCopyText(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
