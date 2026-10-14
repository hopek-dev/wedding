"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, ExternalLink, ImagePlus, Gift, Link2, Loader2, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addGiftFromLink, deleteRegistryItem, lookupProduct, moveRegistryItem, releaseClaim, saveRegistryItem, uploadRegistryImage } from "@/app/actions/registry";
import type { RegistryClaim, RegistryItem } from "@/lib/registry";
import { MAX_UPLOAD_BYTES, prepareImage } from "@/lib/client-image";

interface Draft {
  title: string;
  url: string;
  image_url: string;
  price_text: string;
  store: string;
  note: string;
  quantity: string;
}

const blank: Draft = { title: "", url: "", image_url: "", price_text: "", store: "", note: "", quantity: "1" };
const toDraft = (i: RegistryItem): Draft => ({
  title: i.title,
  url: i.url ?? "",
  image_url: i.image_url ?? "",
  price_text: i.price_text ?? "",
  store: i.store ?? "",
  note: i.note ?? "",
  quantity: String(i.quantity),
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ItemForm({ initial, id, onDone, submitLabel }: { initial: Draft; id: string | null; onDone: () => void; submitLabel: string }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(initial);
  const [looking, setLooking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState("");
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD((cur) => ({ ...cur, [k]: e.target.value }));

  async function fetchDetails() {
    if (!d.url.trim()) return;
    setLooking(true);
    setHint("");
    const r = await lookupProduct(d.url);
    setLooking(false);
    if (!r.ok) return setHint(r.error);
    setD((cur) => ({
      ...cur,
      url: r.url,
      store: cur.store || r.store,
      title: r.info.title || cur.title,
      image_url: r.info.image || cur.image_url,
      price_text: r.info.price || cur.price_text,
    }));
    setHint(r.info.note ?? "Details filled in. Check them, then add it.");
  }

  async function save() {
    setSaving(true);
    const r = await saveRegistryItem(id, { ...d, quantity: Number(d.quantity) || 1 });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(id ? "Saved." : "Added to the registry.");
    router.refresh();
    onDone();
  }

  return (
    <div className="grid gap-3">
      <Field label="Link to the gift (Amazon, John Lewis, anywhere)">
        <div className="flex gap-2">
          <Input value={d.url} onChange={set("url")} placeholder="https://www.amazon.co.uk/…" inputMode="url" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), fetchDetails())} />
          <Button type="button" variant="outline" onClick={fetchDetails} disabled={looking || !d.url.trim()} className="shrink-0">
            {looking ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} Fetch details
          </Button>
        </div>
      </Field>
      {hint && <p className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">{hint}</p>}
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem_6rem]">
        <Field label="Name">
          <Input value={d.title} onChange={set("title")} placeholder="Dualit toaster" />
        </Field>
        <Field label="Price">
          <Input value={d.price_text} onChange={set("price_text")} placeholder="£89.00" />
        </Field>
        <Field label="How many">
          <Input value={d.quantity} onChange={set("quantity")} inputMode="numeric" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Photo link (optional)">
          <Input value={d.image_url} onChange={set("image_url")} placeholder="https://…/photo.jpg" inputMode="url" />
        </Field>
        <Field label="Shop name (optional)">
          <Input value={d.store} onChange={set("store")} placeholder="Amazon" />
        </Field>
      </div>
      <Field label="Note for guests (optional)">
        <Textarea rows={2} value={d.note} onChange={set("note")} placeholder="Any colour is fine" />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm hover:bg-secondary">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} Upload a photo
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const picked = e.target.files?.[0];
              e.target.value = "";
              if (!picked) return;
              setUploading(true);
              try {
                const file = await prepareImage(picked);
                if (file.size > MAX_UPLOAD_BYTES) return toast.error("That picture is too big to upload. Try a smaller copy, or a JPEG.");
                const fd = new FormData();
                fd.set("file", file);
                const r = await uploadRegistryImage(fd);
                if (!r.ok) return toast.error(r.error);
                setD((cur) => ({ ...cur, image_url: r.url }));
              } catch {
                toast.error("The upload failed. Please try again.");
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        <span className="text-xs text-muted-foreground">Use this when a shop won&rsquo;t show its photo: save the picture from the shop, then upload it.</span>
      </div>
      {d.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.image_url} alt="" referrerPolicy="no-referrer" className="h-24 w-24 rounded-md border object-contain" />
      )}
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving || !d.title.trim()}>
          {saving && <Loader2 className="size-4 animate-spin" />} {submitLabel}
        </Button>
        {id && (
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function QuickAdd({ onAdded }: { onAdded: (id: string, incomplete: boolean) => void }) {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);

  async function add(raw: string) {
    const url = raw.trim();
    if (!url || busy) return;
    setBusy(true);
    const r = await addGiftFromLink(url);
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setLink("");
    router.refresh();
    if (r.incomplete) {
      toast.message(`Added "${r.title}"`, { description: "That shop didn't show everything, so check the details below." });
    } else {
      toast.success(`Added "${r.title}"`);
    }
    onAdded(r.id, r.incomplete);
  }

  return (
    <section className="rounded-md border bg-card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-medium">
        <Gift className="size-5 text-muted-foreground" /> Add a gift
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">Copy the link to any item from any shop, then paste it here. It is added straight away.</p>
      <div className="flex gap-2">
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").trim();
            if (/^https?:\/\/\S+$/i.test(text)) {
              e.preventDefault();
              setLink(text);
              add(text);
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(link))}
          disabled={busy}
          placeholder="Paste a link, e.g. https://www.amazon.co.uk/…"
          inputMode="url"
          aria-label="Link to the gift"
          className="h-11"
        />
        <Button type="button" onClick={() => add(link)} disabled={busy || !link.trim()} className="h-11 shrink-0">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} {busy ? "Adding…" : "Add"}
        </Button>
      </div>
      <button type="button" onClick={() => setManual((m) => !m)} className="mt-3 text-sm text-muted-foreground underline underline-offset-4">
        {manual ? "Hide" : "Add by hand instead"}
      </button>
      {manual && (
        <div className="mt-4 border-t pt-4">
          <ItemForm id={null} initial={blank} onDone={() => setManual(false)} submitLabel="Add to registry" />
        </div>
      )}
    </section>
  );
}

export function RegistryManager({ items, claims }: { items: RegistryItem[]; claims: RegistryClaim[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [, start] = useTransition();
  const ids = items.map((i) => i.id);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Something went wrong.");
      else if (done) toast.success(done);
      router.refresh();
    });

  return (
    <div className="grid gap-6">
      <QuickAdd onAdded={(id, incomplete) => incomplete && setEditing(id)} />

      <section className="grid gap-3">
        <h2 className="text-lg font-medium">
          On the registry <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
        </h2>
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet. Paste a link above to add your first gift.</p>}
        {items.map((it, i) => {
          const mine = claims.filter((c) => c.item_id === it.id);
          const taken = mine.reduce((a, c) => a + c.quantity, 0);
          return (
            <article key={it.id} className="rounded-md border bg-card p-4">
              {editing === it.id ? (
                <ItemForm id={it.id} initial={toDraft(it)} onDone={() => setEditing(null)} submitLabel="Save changes" />
              ) : (
                <div className="flex gap-4">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-md border bg-white">
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-contain" />
                    ) : (
                      <Gift className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <h3 className="font-medium">{it.title}</h3>
                      {it.price_text && <span className="text-sm text-muted-foreground">{it.price_text}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {it.store || "No shop"} · {taken} of {it.quantity} bought
                      {it.url && (
                        <>
                          {" · "}
                          <a href={it.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
                            Open <ExternalLink className="size-3" />
                          </a>
                        </>
                      )}
                    </p>
                    {mine.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {mine.map((c) => (
                          <li key={c.id} className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pr-1 pl-3 text-xs">
                            <Check className="size-3 text-green-500" aria-label="bought" />
                            {c.guest_name}
                            {c.quantity > 1 ? ` ×${c.quantity}` : ""}
                            <button
                              type="button"
                              aria-label={`Remove ${c.guest_name}'s purchase`}
                              className="grid size-6 place-items-center rounded-full hover:bg-background"
                              onClick={() => confirm(`Remove ${c.guest_name}'s purchase from the list? Only do this if it was marked by mistake.`) && run(() => releaseClaim(c.id), "Removed.")}
                            >
                              <X className="size-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-start">
                    <Button size="icon" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => run(() => moveRegistryItem(ids, i, -1))}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Move down" disabled={i === items.length - 1} onClick={() => run(() => moveRegistryItem(ids, i, 1))}>
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={`Edit ${it.title}`} onClick={() => setEditing(it.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${it.title}`}
                      onClick={() => confirm(`Remove "${it.title}" from the registry?${mine.length ? " Its reservations go with it." : ""}`) && run(() => deleteRegistryItem(it.id), "Removed.")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
