import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Cream tile with the couple's initials in the website's olive tone.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffec",
        }}
      >
        <span style={{ fontSize: 74, color: "#777150", fontFamily: "serif", fontStyle: "italic" }}>V&amp;H</span>
      </div>
    ),
    { ...size }
  );
}
