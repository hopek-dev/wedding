"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { mirrorImage, storeImage } from "@/lib/image-mirror";
import { readProduct, type ProductInfo } from "@/lib/product-scrape";
import { safeHttpUrl, storeFromUrl, type PublicRegistryItem, type RegistryClaim, type RegistryItem } from "@/lib/registry";

// ---- planner (signed in) ----

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const TABLE_MISSING = "The registry tables aren't set up yet. Run supabase/migrations/0010_gift_registry.sql in Supabase.";

function fail(err: unknown): { ok: false; error: string } {
  const e = err as { message?: string; code?: string } | null;
  if (e?.code === "42P01" || e?.code === "PGRST205" || /registry_(items|claims)/.test(e?.message ?? "")) return { ok: false, error: TABLE_MISSING };
  return { ok: false, error: e?.message || "Something went wrong." };
}

export async function lookupProduct(link: string): Promise<Result<{ info: ProductInfo; url: string; store: string }>> {
  try {
    await requireAdmin();
    const url = safeHttpUrl(link);
    if (!url) return { ok: false, error: "That doesn't look like a web link." };
    return { ok: true, info: await readProduct(url), url, store: storeFromUrl(url) };
  } catch (err) {
    return fail(err);
  }
}

// A readable name from the link itself, for shops that won't show us the product ("le-creuset-casserole" -> "Le creuset casserole").
function titleFromUrl(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter((p) => p && !/^(dp|gp|product|products|p|item|itm|listing|en|gb|uk|us|ip)$/i.test(p) && !/^[A-Z0-9]{10}$/.test(p) && !/^[a-z]?\d{4,}$/i.test(p));
    const slug = decodeURIComponent(parts[parts.length - 1] ?? "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_+]+/g, " ").trim();
    if (slug.length > 3) return slug.charAt(0).toUpperCase() + slug.slice(1, 120);
    return `Gift from ${storeFromUrl(url) || u.hostname}`;
  } catch {
    return "Gift";
  }
}

// One step: paste a link and the gift is added, with whatever could be read from the page.
// `incomplete` tells the planner to check the details (the shop may have blocked us).
export async function addGiftFromLink(link: string): Promise<Result<{ id: string; title: string; incomplete: boolean }>> {
  try {
    await requireAdmin();
    const url = safeHttpUrl(link);
    if (!url) return { ok: false, error: "That doesn't look like a web link." };
    const supabase = createServiceClient();
    const { data: dupe } = await supabase.from("registry_items").select("id,title").eq("url", url).limit(1);
    if (dupe?.length) return { ok: false, error: `"${dupe[0].title}" is already on the registry.` };
    const info = await readProduct(url);
    const row = clean({ title: info.title || titleFromUrl(url), url, image_url: (await mirrorImage(info.image, url)) ?? info.image, price_text: info.price });
    const { data: last } = await supabase.from("registry_items").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    const { data, error } = await supabase.from("registry_items").insert({ ...row, sort_order: (last?.[0]?.sort_order ?? 0) + 1 }).select("id").single();
    if (error) throw error;
    revalidatePath("/registry");
    revalidatePath("/gift-list");
    return { ok: true, id: data.id, title: row.title, incomplete: !info.title || !info.image || !info.price };
  } catch (err) {
    return fail(err);
  }
}

export interface ItemInput {
  title: string;
  url?: string;
  image_url?: string;
  price_text?: string;
  store?: string;
  note?: string;
  quantity?: number;
}

function clean(input: ItemInput) {
  const url = safeHttpUrl(input.url);
  return {
    title: input.title.trim().slice(0, 200),
    url,
    image_url: safeHttpUrl(input.image_url),
    price_text: input.price_text?.trim().slice(0, 40) || null,
    store: (input.store?.trim() || storeFromUrl(url)).slice(0, 60) || null,
    note: input.note?.trim().slice(0, 500) || null,
    quantity: Math.min(99, Math.max(1, Math.floor(Number(input.quantity) || 1))),
  };
}

export async function listRegistryAdmin(): Promise<Result<{ items: RegistryItem[]; claims: RegistryClaim[] }>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data: items, error } = await supabase.from("registry_items").select("*").order("sort_order").order("created_at");
    if (error) throw error;
    const { data: claims, error: e2 } = await supabase.from("registry_claims").select("*").order("created_at");
    if (e2) throw e2;
    return { ok: true, items: (items ?? []) as RegistryItem[], claims: (claims ?? []) as RegistryClaim[] };
  } catch (err) {
    return fail(err);
  }
}

// For shops that won't show us a photo: the planner uploads one from their device.
export async function uploadRegistryImage(form: FormData): Promise<Result<{ url: string }>> {
  try {
    await requireAdmin();
    const file = form.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/")) return { ok: false, error: "Choose a picture file." };
    if (file.size > 8_000_000) return { ok: false, error: "That picture is too big (8 MB at most)." };
    const url = await storeImage(Buffer.from(await file.arrayBuffer()));
    return url ? { ok: true, url } : { ok: false, error: "The picture couldn't be saved." };
  } catch (err) {
    return fail(err);
  }
}

export async function saveRegistryItem(id: string | null, input: ItemInput): Promise<Result> {
  try {
    await requireAdmin();
    if (!input.title?.trim()) return { ok: false, error: "Give the gift a name." };
    const supabase = createServiceClient();
    const row = clean(input);
    row.image_url = safeHttpUrl(await mirrorImage(row.image_url, row.url));
    if (id) {
      const { error } = await supabase.from("registry_items").update({ ...row, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    } else {
      const { data: last } = await supabase.from("registry_items").select("sort_order").order("sort_order", { ascending: false }).limit(1);
      const { error } = await supabase.from("registry_items").insert({ ...row, sort_order: (last?.[0]?.sort_order ?? 0) + 1 });
      if (error) throw error;
    }
    revalidatePath("/registry");
    revalidatePath("/gift-list");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteRegistryItem(id: string): Promise<Result> {
  try {
    await requireAdmin();
    const { error } = await createServiceClient().from("registry_items").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/registry");
    revalidatePath("/gift-list");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// Swap an item with its neighbour. `ids` is the current order on screen.
export async function moveRegistryItem(ids: string[], index: number, direction: -1 | 1): Promise<Result> {
  try {
    await requireAdmin();
    const j = index + direction;
    if (j < 0 || j >= ids.length) return { ok: true };
    const order = [...ids];
    [order[index], order[j]] = [order[j], order[index]];
    const supabase = createServiceClient();
    for (let i = 0; i < order.length; i++) {
      const { error } = await supabase.from("registry_items").update({ sort_order: i + 1 }).eq("id", order[i]);
      if (error) throw error;
    }
    revalidatePath("/registry");
    revalidatePath("/gift-list");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// Only the couple can remove a "bought" entry (e.g. it was marked by mistake).
export async function releaseClaim(claimId: string): Promise<Result> {
  try {
    await requireAdmin();
    const { error } = await createServiceClient().from("registry_claims").delete().eq("id", claimId);
    if (error) throw error;
    revalidatePath("/registry");
    revalidatePath("/gift-list");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ---- public (guests, no sign-in) ----

// Never includes who bought anything.
export async function getPublicRegistry(): Promise<{ items: PublicRegistryItem[]; ready: boolean }> {
  try {
    const supabase = createServiceClient();
    const { data: items, error } = await supabase.from("registry_items").select("*").order("sort_order").order("created_at");
    if (error) throw error;
    const { data: claims, error: e2 } = await supabase.from("registry_claims").select("item_id,quantity");
    if (e2) throw e2;
    const taken = new Map<string, number>();
    for (const c of claims ?? []) taken.set(c.item_id, (taken.get(c.item_id) ?? 0) + c.quantity);
    return {
      ready: true,
      items: ((items ?? []) as RegistryItem[]).map(({ sort_order: _s, created_at: _c, ...it }) => ({
        ...it,
        remaining: Math.max(0, it.quantity - (taken.get(it.id) ?? 0)),
      })),
    };
  } catch {
    return { items: [], ready: false };
  }
}

export type BoughtResult = { ok: true; remaining: number } | { ok: false; error: string };

// A guest says they've bought a gift. There is no reserving and no taking it back: once it's marked,
// only the couple can remove it (from the planner), so the list stays trustworthy.
export async function markBought(input: { itemId: string; name: string; quantity?: number }): Promise<BoughtResult> {
  try {
    const name = input.name?.replace(/\s+/g, " ").trim().slice(0, 60);
    if (!name) return { ok: false, error: "Please add your name so Vanessa and Hope know who it's from." };
    if (!/^[0-9a-f-]{36}$/i.test(input.itemId)) return { ok: false, error: "That gift wasn't found." };
    const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1));
    const supabase = createServiceClient();
    const { data: item } = await supabase.from("registry_items").select("id,quantity").eq("id", input.itemId).maybeSingle();
    if (!item) return { ok: false, error: "That gift wasn't found." };
    const { data: claims } = await supabase.from("registry_claims").select("quantity").eq("item_id", item.id);
    const left = item.quantity - (claims ?? []).reduce((a, c) => a + c.quantity, 0);
    if (left <= 0) return { ok: false, error: "Someone else has just bought the last one. Thank you all the same!" };
    if (quantity > left) return { ok: false, error: `Only ${left} left.` };
    const { error } = await supabase
      .from("registry_claims")
      .insert({ item_id: item.id, guest_name: name, quantity, cancel_token: randomUUID(), purchased_at: new Date().toISOString() });
    if (error) throw error;
    revalidatePath("/gift-list");
    revalidatePath("/registry");
    return { ok: true, remaining: left - quantity };
  } catch (err) {
    const f = fail(err);
    return { ok: false, error: f.error };
  }
}
