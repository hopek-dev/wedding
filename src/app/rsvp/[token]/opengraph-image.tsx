import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { COUPLE_FULL_NAMES } from "@/lib/site";

export const alt = "Your invitation from Vanessa & Hope";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same look as the invitation card: greige paper, the painting of the venue, a
// small gold V&H, the couple's names in spaced capitals with a script "and",
// then the italic invitation lines.
const paper = "#e9e6d9";
const ink = "#1f1e1b";
const soft = "rgba(31, 30, 27, 0.92)";
const gold = "#a67c2a";

// The card WhatsApp shows under the link. It carries no guest name, so it is the
// same for everyone and needs no lookup.
export default async function Image() {
  // Read from disk (fetching file URLs isn't supported in the Node runtime).
  const fontDir = join(process.cwd(), "src", "app", "rsvp", "[token]", "fonts");
  const [script, caps, italic, serif, art] = await Promise.all([
    readFile(join(fontDir, "LuxuriousScript-Regular.ttf")),
    readFile(join(fontDir, "cormorant-garamond-latin-500-normal.woff")),
    readFile(join(fontDir, "cormorant-garamond-latin-400-italic.woff")),
    readFile(join(fontDir, "tinos-400.woff")),
    readFile(join(process.cwd(), "public", "couple", "venue-watercolor-og.png")),
  ]);
  const artSrc = `data:image/png;base64,${art.toString("base64")}`;
  const [first, second] = COUPLE_FULL_NAMES.map((n) => n.toUpperCase());

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: paper, alignItems: "center", padding: "0 56px" }}>
        {/* The link-preview generator only understands a plain <img>. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artSrc} width={580} height={435} alt="" style={{ width: 580, height: 435 }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, marginLeft: 8 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Tinos",
              fontSize: 30,
              letterSpacing: 2,
              color: gold,
              borderBottom: `2px solid ${gold}`,
              padding: "0 14px 6px",
            }}
          >
            V&amp;H
          </div>
          <div style={{ display: "flex", marginTop: 24, fontFamily: "Cormorant", fontWeight: 600, fontSize: 28, letterSpacing: 5, color: ink }}>
            {first}
          </div>
          <div style={{ display: "flex", fontFamily: "Luxurious", fontSize: 50, lineHeight: 1, color: ink, marginTop: 2, marginBottom: 2 }}>&amp;</div>
          <div style={{ display: "flex", fontFamily: "Cormorant", fontWeight: 500, fontSize: 28, letterSpacing: 5, color: ink }}>
            {second}
          </div>
          <div style={{ display: "flex", marginTop: 30, fontFamily: "Cormorant", fontStyle: "italic", fontWeight: 400, fontSize: 27, color: soft }}>
            Joyfully Invite You
          </div>
          <div style={{ display: "flex", fontFamily: "Cormorant", fontStyle: "italic", fontWeight: 400, fontSize: 27, color: soft, marginTop: 4 }}>
            To Their Wedding Celebrations
          </div>
          <div style={{ display: "flex", marginTop: 26, fontFamily: "Luxurious", fontSize: 34, color: soft }}>
            Tap to open your invitation
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Luxurious", data: script, style: "normal", weight: 400 },
        { name: "Cormorant", data: caps, style: "normal", weight: 500 },
        { name: "Cormorant", data: italic, style: "italic", weight: 400 },
        { name: "Tinos", data: serif, style: "normal", weight: 400 },
      ],
    }
  );
}
