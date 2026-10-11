import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import { COUPLE_FULL_NAMES } from "@/lib/site";

export const alt = "Your invitation from Vanessa & Hope";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

// The picture WhatsApp shows under the link. WhatsApp on a phone shows it wide, above the title. WhatsApp on
// a computer (and some older phones) shrinks it to a tiny square thumbnail cut from its MIDDLE, built on the
// sender's own device, and nothing we do can change how much it is compressed. So the invitation card itself
// sits in the middle of the picture, filling the middle square: whichever way it is cropped, you see the
// painting, the gold V&H and the names, large and simple, never a thin strip of a busy layout.
//
// It is drawn at twice the size and then scaled down, which gives smoother, crisper lettering and painting
// than drawing at 1200 wide directly. The guest's name isn't on it, so it is the same for everyone.
const paper = "#d9d5c3"; // the background around the card
const card = "#efece1";
const ink = "#1b1a17";
const gold = "#9a7020";

// Crop the painting to fill a w × h box, keeping the part chosen on the Photos page.
async function paintingFor(w: number, h: number) {
  const { default: sharp } = await import("sharp");
  const photo = resolvePhoto("invite-painting", await getSitePhotos());
  const input = photo.src.startsWith("http")
    ? Buffer.from(await (await fetch(photo.src)).arrayBuffer())
    : await readFile(join(process.cwd(), "public", photo.src.replace(/^\//, "")));
  const img = sharp(input).rotate();
  const meta = await img.metadata();
  const iw = meta.width ?? w;
  const ih = meta.height ?? h;
  const scale = Math.max(w / iw, h / ih);
  const rw = Math.max(w, Math.round(iw * scale));
  const rh = Math.max(h, Math.round(ih * scale));
  const left = Math.round((rw - w) * (photo.focus.x / 100));
  const top = Math.round((rh - h) * (photo.focus.y / 100));
  const jpeg = await img.resize(rw, rh).extract({ left, top, width: w, height: h }).flatten({ background: card }).jpeg({ quality: 92 }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

export default async function Image() {
  const fontDir = join(process.cwd(), "src", "app", "rsvp", "[token]", "fonts");
  const [script, caps, italic, serif] = await Promise.all([
    readFile(join(fontDir, "LuxuriousScript-Regular.ttf")),
    readFile(join(fontDir, "cormorant-garamond-latin-600-normal.woff")),
    readFile(join(fontDir, "cormorant-garamond-latin-500-italic.woff")),
    readFile(join(fontDir, "tinos-400.woff")),
  ]);
  // Everything is drawn at K times the final size (K = 2), then scaled down below.
  const K = 2;
  const u = (n: number) => n * K;
  const CARD_W = 424;
  const CARD_H = 604;
  const ART_W = 396;
  const ART_H = 297;
  const art = await paintingFor(u(ART_W), u(ART_H));
  const [first, second] = COUPLE_FULL_NAMES.map((n) => n.toUpperCase());

  const image = new ImageResponse(
    (
      <div style={{ display: "flex", width: u(1200), height: u(630), background: paper, alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: u(CARD_W),
            height: u(CARD_H),
            background: card,
            padding: `${u(14)}px ${u(14)}px 0`,
            boxShadow: `0 ${u(8)}px ${u(24)}px rgba(40,34,20,0.28)`,
          }}
        >
          {/* The link-preview generator only understands a plain <img>. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={art} width={u(ART_W)} height={u(ART_H)} alt="" style={{ width: u(ART_W), height: u(ART_H) }} />
          <div
            style={{
              display: "flex",
              marginTop: u(26),
              fontFamily: "Tinos",
              fontSize: u(40),
              letterSpacing: u(3),
              color: gold,
              borderBottom: `${u(3)}px solid ${gold}`,
              padding: `0 ${u(14)}px ${u(5)}px`,
            }}
          >
            V&amp;H
          </div>
          <div style={{ display: "flex", marginTop: u(22), fontFamily: "Cormorant", fontWeight: 600, fontSize: u(28), letterSpacing: u(2.5), color: ink, whiteSpace: "nowrap" }}>{first}</div>
          <div style={{ display: "flex", fontFamily: "Luxurious", fontSize: u(64), lineHeight: 1, color: ink, marginTop: u(2), marginBottom: u(2) }}>&amp;</div>
          <div style={{ display: "flex", fontFamily: "Cormorant", fontWeight: 600, fontSize: u(28), letterSpacing: u(2.5), color: ink, whiteSpace: "nowrap" }}>{second}</div>
          <div style={{ display: "flex", marginTop: u(22), fontFamily: "Cormorant", fontStyle: "italic", fontWeight: 500, fontSize: u(26), color: ink }}>Joyfully Invite You</div>
        </div>
      </div>
    ),
    {
      width: u(1200),
      height: u(630),
      fonts: [
        { name: "Luxurious", data: script, style: "normal", weight: 400 },
        { name: "Cormorant", data: caps, style: "normal", weight: 600 },
        { name: "Cormorant", data: italic, style: "italic", weight: 500 },
        { name: "Tinos", data: serif, style: "normal", weight: 400 },
      ],
    }
  );

  // Scale down to the standard 1200 × 630 as a high-quality JPEG: much smaller than a PNG (WhatsApp skips or
  // shrinks heavy preview images). If that step ever fails, fall back to the plain image so a preview still shows.
  try {
    const { default: sharp } = await import("sharp");
    const png = Buffer.from(await image.arrayBuffer());
    const jpeg = await sharp(png).resize(1200, 630, { kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).jpeg({ quality: 90, progressive: false, chromaSubsampling: "4:4:4" }).toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" } });
  } catch {
    return image;
  }
}
