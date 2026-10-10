import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createServiceClient } from "@/lib/supabase/server";
import { UA, assertPublic } from "@/lib/product-scrape";

// Copies a gift's photo onto our own storage when it is added, so it keeps showing even if the shop
// blocks other sites from displaying its pictures, moves the file, or lets the link expire.
// If anything goes wrong the original link is kept, so adding a gift never fails because of its photo.

const BUCKET = "registry";
const MAX_BYTES = 8_000_000;

async function ensureBucket() {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  // "already exists" is the normal case after the first time
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
}

export function isOurImage(url: string | null | undefined) {
  const base = process.env.SUPABASE_URL;
  return !!url && !!base && url.startsWith(`${base}/storage/v1/object/public/${BUCKET}/`);
}

// Shrinks a picture to a plain, modest WebP every browser can show and keeps it in our storage.
export async function storeImage(buf: Buffer): Promise<string | null> {
  const out = await sharp(buf).rotate().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const supabase = createServiceClient();
  const path = `${randomUUID()}.webp`;
  const opts = { contentType: "image/webp", cacheControl: "31536000" };
  let { error } = await supabase.storage.from(BUCKET).upload(path, out, opts);
  if (error) {
    await ensureBucket();
    ({ error } = await supabase.storage.from(BUCKET).upload(path, out, opts));
  }
  if (error) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function mirrorImage(src: string | null | undefined, referer?: string | null): Promise<string | null> {
  if (!src) return null;
  if (isOurImage(src)) return src;
  try {
    const url = new URL(src);
    await assertPublic(url);
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "user-agent": UA, accept: "image/avif,image/webp,image/*,*/*;q=0.8", ...(referer ? { referer } : {}) },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) return src;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES || buf.length < 200) return src;
    return (await storeImage(buf)) ?? src;
  } catch {
    return src;
  }
}
