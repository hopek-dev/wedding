"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Gift, Loader2 } from "lucide-react";
import { claimGift, undoClaim } from "@/app/actions/registry";
import type { PublicRegistryItem } from "@/lib/registry";

const KEY = "gift-claims";
const NAME_KEY = "gift-name";
type Mine = { claimId: string; token: string; name: string };

function read(): Record<string, Mine> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}
function write(v: Record<string, Mine>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* private mode: the reservation still counts, the guest just can't undo it from here */
  }
}

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-medium tracking-wide transition-all";
const primary = `${btn} bg-primary text-primary-foreground shadow-sm hover:opacity-90`;
const outline = `${btn} text-foreground ring-1 ring-foreground/25 hover:bg-secondary`;

export function GiftCard({ item }: { item: PublicRegistryItem }) {
  const [remaining, setRemaining] = useState(item.remaining);
  const [mine, setMine] = useState<Mine | null>(null);
  const [asking, setAsking] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRemaining(item.remaining);
    setMine(read()[item.id] ?? null);
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      /* ignore */
    }
  }, [item.id, item.remaining]);

  async function reserve() {
    setBusy(true);
    setError("");
    const r = await claimGift({ itemId: item.id, name, quantity: qty });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    const m = { claimId: r.claimId, token: r.token, name: name.trim() };
    write({ ...read(), [item.id]: m });
    try {
      localStorage.setItem(NAME_KEY, m.name);
    } catch {
      /* ignore */
    }
    setMine(m);
    setRemaining(r.remaining);
    setAsking(false);
  }

  async function undo() {
    if (!mine) return;
    setBusy(true);
    const r = await undoClaim(mine.claimId, mine.token);
    setBusy(false);
    if (!r.ok && !/already removed/.test(r.error)) return setError(r.error);
    const all = read();
    delete all[item.id];
    write(all);
    setMine(null);
    setRemaining((n) => Math.min(item.quantity, n + 1));
  }

  const soldOut = remaining <= 0 && !mine;
  const store = item.store || "the shop";

  return (
    <article className="flex h-full flex-col bg-card shadow-[0_18px_44px_-30px_rgba(70,62,30,0.45)] ring-1 ring-foreground/10">
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-white">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.title} referrerPolicy="no-referrer" loading="lazy" className={`size-full object-contain p-4 ${soldOut ? "opacity-40" : ""}`} />
        ) : (
          <Gift className="size-10 text-muted-foreground" strokeWidth={1.2} />
        )}
        {soldOut && <span className="absolute top-3 left-3 rounded-full bg-foreground px-3 py-1 text-[11px] tracking-[0.18em] text-background uppercase">Reserved</span>}
        {item.quantity > 1 && !soldOut && (
          <span className="absolute top-3 left-3 rounded-full bg-secondary px-3 py-1 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            {remaining} of {item.quantity} left
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-5 pt-5 pb-6">
        <h3 className="text-xl leading-snug font-light" style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.35rem" }}>
          {item.title}
        </h3>
        <p className="mt-1 text-[13px] font-light text-muted-foreground">
          {[item.store, item.price_text].filter(Boolean).join(" · ")}
        </p>
        {item.note && <p className="mt-3 text-[14px] leading-relaxed font-light text-muted-foreground">{item.note}</p>}

        <div className="mt-auto grid gap-2.5 pt-5">
          {mine ? (
            <div className="rounded-md bg-secondary px-4 py-3 text-[14px] leading-relaxed font-light">
              <p>
                Thank you, {mine.name}! This is marked as yours.
                {item.url && " Now pick it up from the shop:"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className={primary}>
                    Buy at {store} <ExternalLink className="size-4" strokeWidth={1.6} />
                  </a>
                )}
                <button type="button" onClick={undo} disabled={busy} className={outline}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null} Undo
                </button>
              </div>
            </div>
          ) : asking ? (
            <div className="grid gap-2.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                aria-label="Your name"
                maxLength={60}
                autoComplete="name"
                className="h-11 rounded-md border bg-background px-3 text-base"
              />
              {remaining > 1 && (
                <label className="flex items-center gap-2 text-[14px] font-light">
                  How many?
                  <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-10 rounded-md border bg-background px-2">
                    {Array.from({ length: remaining }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {error && <p className="text-[13px] text-red-700">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={reserve} disabled={busy || !name.trim()} className={`${primary} flex-1 disabled:opacity-50`}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null} Reserve it
                </button>
                <button type="button" onClick={() => setAsking(false)} className={outline}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {!soldOut && (
                <button type="button" onClick={() => setAsking(true)} className={primary}>
                  I&rsquo;ll get this
                </button>
              )}
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className={outline}>
                  View at {store} <ExternalLink className="size-4" strokeWidth={1.6} />
                </a>
              )}
              {error && <p className="text-[13px] text-red-700">{error}</p>}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
