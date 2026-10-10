import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase/server";
import { PREVIEW_TOKEN } from "@/lib/invitation";
import { partyFullName } from "@/lib/party";

export const alt = "Your invitation from Vanessa & Hope";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const olive = "#777150";
const soft = "#8d8569";

// The card WhatsApp shows under the link. It's generated per guest, so each
// person sees an invitation with their own name on it.
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let name = "Our dear guest";
  if (token === PREVIEW_TOKEN) {
    name = "Alex Guest";
  } else if (/^[a-f0-9]{8,64}$/i.test(token)) {
    const db = createServiceClient();
    const { data } = await db
      .from("guests")
      .select("id, title, first_name, last_name")
      .eq("rsvp_token", token)
      .maybeSingle();
    if (data) {
      const { data: plusOnes } = await db
        .from("guests")
        .select("title, first_name, last_name")
        .eq("plus_one_of", data.id);
      name = partyFullName([data, ...(plusOnes ?? [])]);
    }
  }

  // Read from disk (fetching file URLs isn't supported in the Node runtime).
  const fontDir = join(process.cwd(), "src", "app", "rsvp", "[token]", "fonts");
  const [script, light, regular] = await Promise.all([
    readFile(join(fontDir, "PinyonScript-Regular.ttf")),
    readFile(join(fontDir, "raleway-300.woff")),
    readFile(join(fontDir, "raleway-400.woff")),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#ffffec", padding: 34 }}>
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            border: `2px solid #a69475`,
            padding: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              border: `1px solid #cfc7a1`,
              background: "#fffff6",
            }}
          >
            <div style={{ display: "flex", fontFamily: "Raleway", fontWeight: 300, fontSize: 24, letterSpacing: 9, color: soft }}>
              YOU ARE INVITED
            </div>
            <div style={{ display: "flex", fontFamily: "Pinyon", fontSize: 150, lineHeight: 1.1, color: olive, marginTop: 6 }}>
              Vanessa &amp; Hope
            </div>
            <div style={{ display: "flex", fontFamily: "Raleway", fontWeight: 300, fontSize: 28, color: soft, marginTop: 4 }}>
              request the pleasure of the company of
            </div>
            <div style={{ display: "flex", fontFamily: "Pinyon", fontSize: name.length > 22 ? 70 : 92, lineHeight: 1.2, color: "#3d3b2a", marginTop: 10 }}>
              {name}
            </div>
            <div style={{ display: "flex", width: 90, height: 1, background: "#a69475", marginTop: 22 }} />
            <div style={{ display: "flex", fontFamily: "Raleway", fontWeight: 400, fontSize: 24, color: soft, marginTop: 22, letterSpacing: 2 }}>
              Tap to open your invitation and RSVP
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pinyon", data: script, style: "normal", weight: 400 },
        { name: "Raleway", data: light, style: "normal", weight: 300 },
        { name: "Raleway", data: regular, style: "normal", weight: 400 },
      ],
    }
  );
}
