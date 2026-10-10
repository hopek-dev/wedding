// Gift registry types and small helpers shared by the planner page, the public page and the actions.

export interface RegistryItem {
  id: string;
  title: string;
  url: string | null;
  image_url: string | null;
  price_text: string | null;
  store: string | null;
  note: string | null;
  quantity: number;
  sort_order: number;
  created_at: string;
}

export interface RegistryClaim {
  id: string;
  item_id: string;
  guest_name: string;
  quantity: number;
  purchased_at: string | null; // set when the guest says they've bought it (migration 0011)
  created_at: string;
}

// What guests see: how many are wanted and left, never who bought them (it keeps the surprise).
export interface PublicRegistryItem extends Omit<RegistryItem, "sort_order" | "created_at"> {
  remaining: number;
}

// "www.amazon.co.uk" -> "Amazon". Just a tidy domain name; the planner can edit it.
export function storeFromUrl(url: string | null | undefined) {
  if (!url) return "";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const name = host.split(".").slice(0, -1).filter((p) => !["co", "com"].includes(p)).join(" ") || host;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "";
  }
}

// Only web links are ever stored or opened.
export function safeHttpUrl(v: string | null | undefined) {
  const t = (v ?? "").trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
