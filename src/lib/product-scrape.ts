import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Reads a shop page and pulls out a title, picture and price, so the couple can paste a link from any
// shop. Runs on the server for the signed-in planner only. Because it fetches a web address someone
// typed, it refuses anything that points at a private network and follows redirects one hop at a time.

export interface ProductInfo {
  title: string;
  image: string;
  price: string;
  note?: string; // why some details are missing, shown to the planner
}

const MAX_BYTES = 2_000_000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function privateIp(ip: string) {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.") || v.startsWith("::ffff:169.254.");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
}

async function assertPublic(u: URL) {
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Only http and https links can be read.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("That address isn't a public website.");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addrs.length === 0 || addrs.some((a) => privateIp(a.address))) throw new Error("That address isn't a public website.");
}

async function fetchHtml(start: string) {
  let url = new URL(start);
  for (let hop = 0; hop < 5; hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(9000),
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", "accept-language": "en-GB,en;q=0.9" },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok) throw new Error(`The shop answered with status ${res.status}.`);
    const reader = res.body?.getReader();
    if (!reader) return { html: "", url };
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    reader.cancel().catch(() => {});
    return { html: new TextDecoder("utf-8").decode(Buffer.concat(chunks)), url };
  }
  throw new Error("Too many redirects.");
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/\s+/g, " ")
    .trim();

function meta(html: string, ...keys: string[]) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const key of keys) {
    for (const tag of tags) {
      const name = /(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
      if (name !== key) continue;
      const content = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(tag);
      const v = content?.[1] ?? content?.[2];
      if (v) return decode(v);
    }
  }
  return "";
}

type Ld = { name?: string; image?: string; price?: string; currency?: string };

function jsonLdProduct(html: string): Ld {
  const blocks = html.match(/<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];
  const visit = (node: unknown): Ld | null => {
    if (!node || typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (const n of node) {
        const r = visit(n);
        if (r) return r;
      }
      return null;
    }
    const o = node as Record<string, unknown>;
    const type = ([] as unknown[]).concat(o["@type"] ?? []).map(String);
    if (type.includes("Product")) {
      const img = Array.isArray(o.image) ? o.image[0] : o.image;
      const offer = (Array.isArray(o.offers) ? o.offers[0] : o.offers) as Record<string, unknown> | undefined;
      const spec = offer?.priceSpecification as Record<string, unknown> | undefined;
      return {
        name: typeof o.name === "string" ? o.name : undefined,
        image: typeof img === "string" ? img : typeof (img as { url?: string } | undefined)?.url === "string" ? (img as { url: string }).url : undefined,
        price: String(offer?.price ?? offer?.lowPrice ?? spec?.price ?? "") || undefined,
        currency: String(offer?.priceCurrency ?? spec?.priceCurrency ?? "") || undefined,
      };
    }
    for (const v of Object.values(o)) {
      const r = visit(v);
      if (r) return r;
    }
    return null;
  };
  for (const b of blocks) {
    const body = b.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const r = visit(JSON.parse(body));
      if (r) return r;
    } catch {
      /* ignore malformed blocks */
    }
  }
  return {};
}

const SYMBOLS: Record<string, string> = { GBP: "£", USD: "$", EUR: "€", CAD: "CA$", AUD: "A$" };
function money(price?: string, currency?: string) {
  if (!price) return "";
  const n = Number(price.replace(/,/g, ""));
  if (!Number.isFinite(n)) return price;
  const sym = currency ? (SYMBOLS[currency] ?? `${currency} `) : "";
  return `${sym}${n.toFixed(2)}`;
}

export async function readProduct(link: string): Promise<ProductInfo> {
  let page: { html: string; url: URL };
  try {
    page = await fetchHtml(link);
  } catch (err) {
    const why = err instanceof Error ? err.message : "The page couldn't be read.";
    return { title: "", image: "", price: "", note: `${why} Some shops block automatic reading, so fill in the details below.` };
  }
  const { html, url } = page;
  const ld = jsonLdProduct(html);
  const abs = (v: string) => {
    try {
      return v ? new URL(v, url).toString() : "";
    } catch {
      return "";
    }
  };

  let title = ld.name ? decode(ld.name) : meta(html, "og:title", "twitter:title");
  if (!title) title = decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  const amazonTitle = /id="productTitle"[^>]*>([\s\S]*?)<\/span>/i.exec(html)?.[1];
  if (amazonTitle) title = decode(amazonTitle.replace(/<[^>]+>/g, ""));

  let image = abs(ld.image ?? meta(html, "og:image", "og:image:secure_url", "twitter:image"));
  if (!image) {
    const hi = /"hiRes"\s*:\s*"(https:[^"]+)"/.exec(html)?.[1] ?? /data-old-hires="([^"]+)"/.exec(html)?.[1];
    if (hi) image = abs(hi);
  }

  let price = money(ld.price, ld.currency);
  if (!price) price = money(meta(html, "product:price:amount", "og:price:amount"), meta(html, "product:price:currency", "og:price:currency"));
  if (!price) {
    const a = /class="a-offscreen"[^>]*>\s*([£$€][\d.,]+)/i.exec(html)?.[1];
    if (a) price = a;
  }

  image = image.replace(/^http:\/\//i, "https://"); // an http picture would be blocked on the https site

  // Amazon often serves a bare page, but its picture can still be found from the product code in the link.
  if (!image) {
    const asin = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/i.exec(url.pathname + "/")?.[1];
    if (asin && /(^|\.)amazon\./i.test(url.hostname)) image = `https://m.media-amazon.com/images/P/${asin.toUpperCase()}.01.LZZZZZZZ.jpg`;
  }

  // A bare store name ("Amazon.co.uk") with nothing else means the shop didn't show us the product.
  if (!price && (title.length < 4 || /^(amazon|ebay|etsy|argos|john lewis|currys)[\w. ]*$/i.test(title))) title = "";

  // a bot-check page isn't a product
  if (/captcha|robot check|are you a human|access denied|just a moment/i.test(title)) {
    return { title: "", image: "", price: "", note: "That shop showed a bot check instead of the product. Fill in the details below." };
  }
  const missing = [!title && "name", !image && "photo", !price && "price"].filter(Boolean);
  return { title: title.slice(0, 200), image, price, note: missing.length ? `Couldn't find the ${missing.join(" or ")} automatically. Add it below.` : undefined };
}
