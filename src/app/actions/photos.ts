"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { SLOT_BY_ID, type PhotoRow } from "@/lib/site-photos";

const BUCKET = "site";
const MAX_BYTES = 12_000_000;

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const TABLE_MISSING = "The photos table isn't set up yet. Run supabase/migrations/0012_site_photos.sql in Supabase.";

function fail(err: unknown): { ok: false; error: string } {
  const e = err as { message?: string; code?: string } | null;
  if (e?.code === "42P01" || e?.code === "PGRST205" || /site_photos/.test(e?.message ?? "")) return { ok: false, error: TABLE_MISSING };
  return { ok: false, error: e?.message || "Something went wrong." };
}

// Public site: what has been changed. Never throws: with no table (or no database) every page just uses the shipped photos.
export async function getSitePhotos(): Promise<Record<string, PhotoRow>> {
  try {
    const { data, error } = await createServiceClient().from("site_photos").select("*");
    if (error) return {};
    return Object.fromEntries((data ?? []).map((r) => [r.slot, r as PhotoRow]));
  } catch {
    return {};
  }
}

export async function listSitePhotosAdmin(): Promise<Result<{ rows: Record<string, PhotoRow> }>> {
  try {
    await requireAdmin();
    const { data, error } = await createServiceClient().from("site_photos").select("*");
    if (error) throw error;
    return { ok: true, rows: Object.fromEntries((data ?? []).map((r) => [r.slot, r as PhotoRow])) };
  } catch (err) {
    return fail(err);
  }
}

async function ensureBucket() {
  const { error } = await createServiceClient().storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
}

function ours(url: string | null | undefined) {
  const base = process.env.SUPABASE_URL;
  return url && base && url.startsWith(`${base}/storage/v1/object/public/${BUCKET}/`) ? url.slice(url.lastIndexOf("/") + 1) : null;
}

async function removeFile(url: string | null | undefined) {
  const name = ours(url);
  if (name) await createServiceClient().storage.from(BUCKET).remove([name]).catch(() => {});
}

function refresh() {
  // every page of the public site
  revalidatePath("/", "layout");
}

// Keep a photo's shape exactly as supplied, upright (honouring the camera's rotation flag), at up to 2600 px
// on its long side: big enough to stay sharp full-screen, small enough to load quickly.
export async function uploadSitePhoto(slot: string, form: FormData): Promise<Result<{ url: string; width: number; height: number }>> {
  try {
    await requireAdmin();
    if (!SLOT_BY_ID.has(slot)) return { ok: false, error: "Unknown photo slot." };
    const file = form.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/")) return { ok: false, error: "Choose a picture file." };
    if (file.size > MAX_BYTES) return { ok: false, error: "That picture is too big (12 MB at most)." };
    const input = Buffer.from(await file.arrayBuffer());
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: 2600, height: 2600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });

    const supabase = createServiceClient();
    const path = `${slot}-${randomUUID().slice(0, 8)}.webp`;
    const opts = { contentType: "image/webp", cacheControl: "31536000" };
    let { error } = await supabase.storage.from(BUCKET).upload(path, data, opts);
    if (error) {
      await ensureBucket();
      ({ error } = await supabase.storage.from(BUCKET).upload(path, data, opts));
    }
    if (error) throw error;
    const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const { data: old } = await supabase.from("site_photos").select("url").eq("slot", slot).maybeSingle();
    const { error: e2 } = await supabase
      .from("site_photos")
      .upsert({ slot, url, width: info.width, height: info.height, updated_at: new Date().toISOString() }, { onConflict: "slot" });
    if (e2) throw e2;
    await removeFile(old?.url);
    refresh();
    return { ok: true, url, width: info.width, height: info.height };
  } catch (err) {
    return fail(err);
  }
}

// Where to aim the crop (percent from the left / top) and the description for screen readers.
export async function saveSitePhotoMeta(slot: string, meta: { focus_x?: number; focus_y?: number; alt?: string }): Promise<Result> {
  try {
    await requireAdmin();
    if (!SLOT_BY_ID.has(slot)) return { ok: false, error: "Unknown photo slot." };
    const patch: Record<string, unknown> = { slot, updated_at: new Date().toISOString() };
    const pct = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
    if (typeof meta.focus_x === "number") patch.focus_x = pct(meta.focus_x);
    if (typeof meta.focus_y === "number") patch.focus_y = pct(meta.focus_y);
    if (typeof meta.alt === "string") patch.alt = meta.alt.trim().slice(0, 300) || null;
    const { error } = await createServiceClient().from("site_photos").upsert(patch, { onConflict: "slot" });
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// Back to the picture that ships with the site (and its original crop and description).
export async function resetSitePhoto(slot: string): Promise<Result> {
  try {
    await requireAdmin();
    if (!SLOT_BY_ID.has(slot)) return { ok: false, error: "Unknown photo slot." };
    const supabase = createServiceClient();
    const { data: old } = await supabase.from("site_photos").select("url").eq("slot", slot).maybeSingle();
    const { error } = await supabase.from("site_photos").delete().eq("slot", slot);
    if (error) throw error;
    await removeFile(old?.url);
    refresh();
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
