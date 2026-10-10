import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { COUPLE_FULL_NAMES } from "@/lib/site";

export const alt = "Your invitation from Vanessa & Hope";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

// Same look as the invitation card: greige paper, the painting of the venue, a
// small gold V&H, the couple's names in spaced capitals with a script "&",
// then the italic invitation lines. WhatsApp shows this at about 300px wide, so the
// painting is large and the lettering is big and heavy enough to stay readable
// when it is shrunk.
const paper = "#e9e6d9";
const ink = "#1b1a17";
const gold = "#9a7020";

// The card WhatsApp shows under the link. It carries no guest name, so it is the
// same for everyone and needs no lookup.
export default async function Image() {
  // Read from disk (fetching file URLs isn't supported in the Node runtime).
  const fontDir = join(process.cwd(), "src", "app", "rsvp", "[token]", "fonts");
  const [script, caps, italic, serif, art] = await Promise.all([
    readFile(join(fontDir, "LuxuriousScript-Regular.ttf")),
    readFile(join(fontDir, "cormorant-garamond-latin-600-normal.woff")),
    readFile(join(fontDir, "cormorant-garamond-latin-500-italic.woff")),
    readFile(join(fontDir, "tinos-400.woff")),
    readFile(join(process.cwd(), "public", "couple", "venue-watercolor-og.jpg")),
  ]);
  const artSrc = `data:image/jpeg;base64,${art.toString("base64")}`;
  const [first, second] = COUPLE_FULL_NAMES.map((n) => n.toUpperCase());

  const image = new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: paper, alignItems: "center", padding: "0 34px 0 30px" }}>
        {/* The link-preview generator only understands a plain <img>. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artSrc} width={680} height={510} alt="" style={{ width: 680, height: 510 }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Tinos",
              fontSize: 46,
              letterSpacing: 3,
              color: gold,
              borderBottom: `3px solid ${gold}`,
              padding: "0 16px 6px",
            }}
          >
            V&amp;H
          </div>
          <div style={{ display: "flex", marginTop: 30, fontFamily: "Cormorant", fontWeight: 600, fontSize: 32, letterSpacing: 3, color: ink }}>
            {first}
          </div>
          <div style={{ display: "flex", fontFamily: "Luxurious", fontSize: 76, lineHeight: 1, color: ink, marginTop: 2, marginBottom: 2 }}>&amp;</div>
          <div style={{ display: "flex", fontFamily: "Cormorant", fontWeight: 600, fontSize: 32, letterSpacing: 3, color: ink }}>
            {second}
          </div>
          <div style={{ display: "flex", marginTop: 32, fontFamily: "Cormorant", fontStyle: "italic", fontWeight: 500, fontSize: 36, color: ink }}>
            Joyfully Invite You
          </div>
          <div style={{ display: "flex", fontFamily: "Cormorant", fontStyle: "italic", fontWeight: 500, fontSize: 36, color: ink, marginTop: 2 }}>
            To Their Wedding Celebrations
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Luxurious", data: script, style: "normal", weight: 400 },
        { name: "Cormorant", data: caps, style: "normal", weight: 600 },
        { name: "Cormorant", data: italic, style: "italic", weight: 500 },
        { name: "Tinos", data: serif, style: "normal", weight: 400 },
      ],
    }
  );

  // Re-encode as a high-quality JPEG: far smaller than the PNG (WhatsApp skips or shrinks heavy
  // preview images) and with a light sharpen so fine lines hold up when it is scaled down.
  // If that step ever fails, fall back to the plain PNG so the preview still appears.
  try {
    const { default: sharp } = await import("sharp");
    const png = Buffer.from(await image.arrayBuffer());
    const jpeg = await sharp(png).sharpen({ sigma: 0.7 }).jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" } });
  } catch {
    return image;
  }
}
