"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, Gift, Loader2 } from "lucide-react";
import { markBought } from "@/app/actions/registry";
import type { PublicRegistryItem } from "@/lib/registry";

// Remembers only the guest's name, to save retyping it on the next gift.
const NAME_KEY = "gift-name";

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-medium tracking-wide transition-all";
const primary = `${btn} bg-primary text-primary-foreground shadow-sm hover:opacity-90`;
const outline = `${btn} text-foreground ring-1 ring-foreground/25 hover:bg-secondary`;

export function GiftCard({ item }: { item: PublicRegistryItem }) {
  const [remaining, setRemaining] = useState(item.remaining);
  const [thanks, setThanks] = useState<string | null>(null); // the name to thank, while the pop-up is open
  const [asking, setAsking] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRemaining(item.remaining);
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      /* ignore */
    }
  }, [item.id, item.remaining]);

  async function submit() {
    setBusy(true);
    setError("");
    const r = await markBought({ itemId: item.id, name, quantity: qty });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    const who = name.trim();
    try {
      localStorage.setItem(NAME_KEY, who);
    } catch {
      /* ignore */
    }
    setThanks(who);
    setRemaining(r.remaining);
    setAsking(false);
  }

  const gone = remaining <= 0;
  const store = item.store || "the shop";

  return (
    <article className="flex h-full flex-col bg-card shadow-[0_18px_44px_-30px_rgba(70,62,30,0.45)] ring-1 ring-foreground/10">
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-white">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.title} referrerPolicy="no-referrer" loading="lazy" className={`size-full object-contain p-4 ${gone ? "opacity-40" : ""}`} />
        ) : (
          <Gift className="size-10 text-muted-foreground" strokeWidth={1.2} />
        )}
        {gone && <span className="absolute top-3 left-3 rounded-full bg-foreground px-3 py-1 text-[11px] tracking-[0.18em] text-background uppercase">Bought</span>}
        {item.quantity > 1 && !gone && (
          <span className="absolute top-3 left-3 rounded-full bg-secondary px-3 py-1 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            {remaining} of {item.quantity} still wanted
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-5 pt-5 pb-6">
        <h3 className="text-xl leading-snug font-light" style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.35rem" }}>
          {item.title}
        </h3>
        <p className="mt-1 text-[13px] font-light text-muted-foreground">{[item.store, item.price_text].filter(Boolean).join(" · ")}</p>
        {item.note && <p className="mt-3 text-[14px] leading-relaxed font-light text-muted-foreground">{item.note}</p>}

        <div className="mt-auto grid gap-2.5 pt-5">
          {asking ? (
            <div className="grid gap-2.5">
              <p className="text-[13px] leading-relaxed font-light text-muted-foreground">Only tap this once you&rsquo;ve bought it. It can&rsquo;t be changed afterwards.</p>
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
                  How many did you buy?
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
                <button type="button" onClick={submit} disabled={busy || !name.trim()} className={`${primary} flex-1 disabled:opacity-50`}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={1.8} />} Yes, I&rsquo;ve bought it
                </button>
                <button type="button" onClick={() => setAsking(false)} className={outline}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {item.url && !gone && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className={primary}>
                  Buy at {store} <ExternalLink className="size-4" strokeWidth={1.6} />
                </a>
              )}
              {!gone && (
                <button type="button" onClick={() => setAsking(true)} className={outline}>
                  I&rsquo;ve bought this
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {thanks && <ThankYou name={thanks} title={item.title} onClose={() => setThanks(null)} />}
    </article>
  );
}

// A one-off lightbox. Closing it (button, backdrop or Escape) leaves the gift showing as bought like it does for everyone.
function ThankYou({ name, title, onClose }: { name: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div data-lenis-prevent className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-5" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thank you"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-background px-7 py-9 text-center shadow-2xl ring-1 ring-foreground/10"
      >
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground ring-1 ring-foreground/10">
          <Check className="size-5" strokeWidth={1.6} />
        </span>
        <p className="text-3xl font-light" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
          Thank you, {name}!
        </p>
        <p className="mt-3 text-[15px] leading-relaxed font-light text-muted-foreground">
          Vanessa and Hope will love the {title}. We&rsquo;ve marked it as bought.
        </p>
        <button type="button" autoFocus onClick={onClose} className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium tracking-wide text-primary-foreground">
          Close
        </button>
      </div>
    </div>
  );
}
