"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Check, ExternalLink, ImagePlus, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetSitePhoto, saveSitePhotoMeta, uploadSitePhoto } from "@/app/actions/photos";
import { resolvePhoto, SLOTS, type PhotoGroup, type PhotoRow, type SlotDef } from "@/lib/site-photos";

const GROUPS: PhotoGroup[] = ["Welcome page: rolling photos", "Page headers (full screen)", "Photos inside pages", "Invitation (personal RSVP link and WhatsApp preview)"];

// Under this width a photo looks soft when it fills a big screen.
const SHARP_WIDTH: Record<PhotoGroup, number> = {
  "Welcome page: rolling photos": 1600,
  "Page headers (full screen)": 1800,
  "Photos inside pages": 1400,
  "Invitation (personal RSVP link and WhatsApp preview)": 1000,
};

function Card({ slot, row }: { slot: SlotDef; row: PhotoRow | undefined }) {
  const router = useRouter();
  const photo = resolvePhoto(slot.id, row ? { [slot.id]: row } : undefined);
  const [focus, setFocus] = useState(photo.focus);
  const [alt, setAlt] = useState(row?.alt ?? "");
  const [busy, setBusy] = useState<"" | "upload" | "focus" | "alt" | "reset">("");
  const file = useRef<HTMLInputElement>(null);
  const replaced = !!row?.url;
  const changed = replaced || row?.focus_x != null || row?.focus_y != null || !!row?.alt;
  const upright = photo.ratio < 1;
  const soft = photo.width < SHARP_WIDTH[slot.group];

  async function upload(f: File) {
    setBusy("upload");
    const fd = new FormData();
    fd.set("file", f);
    const r = await uploadSitePhoto(slot.id, fd);
    setBusy("");
    if (!r.ok) return toast.error(r.error);
    toast.success(`Photo replaced (${r.width} × ${r.height}). The site shows it within a couple of minutes.`);
    router.refresh();
  }

  async function aim(e: React.MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const next = {
      x: Math.round(((e.clientX - box.left) / box.width) * 100),
      y: Math.round(((e.clientY - box.top) / box.height) * 100),
    };
    setFocus(next);
    setBusy("focus");
    const r = await saveSitePhotoMeta(slot.id, { focus_x: next.x, focus_y: next.y });
    setBusy("");
    if (!r.ok) toast.error(r.error);
    else router.refresh();
  }

  async function saveAlt() {
    if (alt.trim() === (row?.alt ?? "").trim()) return;
    setBusy("alt");
    const r = await saveSitePhotoMeta(slot.id, { alt });
    setBusy("");
    if (!r.ok) return toast.error(r.error);
    toast.success("Description saved.");
    router.refresh();
  }

  async function reset() {
    if (!confirm(`Put back the original photo for "${slot.label}"?`)) return;
    setBusy("reset");
    const r = await resetSitePhoto(slot.id);
    setBusy("");
    if (!r.ok) return toast.error(r.error);
    toast.success("Original photo restored.");
    setFocus(slot.focus);
    setAlt("");
    router.refresh();
  }

  return (
    <article className="grid gap-3 rounded-md border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{slot.label}</h3>
          <a href={slot.page} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4">
            On {slot.page} <ExternalLink className="size-3" />
          </a>
        </div>
        {changed && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">Changed</span>}
      </div>

      {/* Click anywhere on the picture to say which part matters; the site keeps that part when it has to crop. */}
      <div
        onClick={aim}
        aria-label="Click the most important part of the photo (faces)"
        className="relative mx-auto w-full cursor-crosshair overflow-hidden rounded-md border bg-muted"
        style={{ aspectRatio: String(photo.ratio), maxHeight: "22rem", maxWidth: upright ? `${22 * photo.ratio}rem` : undefined }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.alt} className="size-full object-cover" draggable={false} />
        <span
          aria-hidden
          className="pointer-events-none absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)]"
          style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
        />
        {busy === "focus" && <Loader2 className="absolute top-2 right-2 size-4 animate-spin text-white" />}
      </div>
      <p className="text-xs text-muted-foreground">Click the picture on the faces. When the site has to crop this photo, it keeps that spot in view. Currently aimed at {focus.x}% across, {focus.y}% down.</p>

      <p className="text-xs text-muted-foreground">
        {photo.width} × {photo.height} px{upright ? " · upright photo (shown whole, with a soft surround, on wide screens)" : ""}
      </p>
      {soft && (
        <p className="flex items-start gap-1.5 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> This photo is on the small side for here, so it can look soft on big screens. A wider original (at least {SHARP_WIDTH[slot.group]} px) would be sharper.
        </p>
      )}

      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">Description (read out for people using screen readers)</span>
        <Input value={alt} onChange={(e) => setAlt(e.target.value)} onBlur={saveAlt} placeholder={slot.alt} />
      </label>

      <div className="flex flex-wrap gap-2">
        <input
          ref={file}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) upload(f);
          }}
        />
        <Button type="button" onClick={() => file.current?.click()} disabled={busy !== ""}>
          {busy === "upload" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {busy === "upload" ? "Uploading…" : "Replace photo"}
        </Button>
        {changed && (
          <Button type="button" variant="outline" onClick={reset} disabled={busy !== ""}>
            {busy === "reset" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Use the original
          </Button>
        )}
        {busy === "alt" && <Check className="my-auto size-4 text-muted-foreground" />}
      </div>
    </article>
  );
}

export function PhotosManager({ rows }: { rows: Record<string, PhotoRow> }) {
  return (
    <div className="grid gap-10">
      {GROUPS.map((g) => (
        <section key={g} className="grid gap-4">
          <h2 className="font-heading text-xl font-semibold tracking-tight">{g}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SLOTS.filter((s) => s.group === g).map((s) => (
              <Card key={s.id} slot={s} row={rows[s.id]} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
