import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Cream tile with the couple's initials in the website's olive tone.
export default function Icon() {
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
          borderRadius: 96,
        }}
      >
        <span style={{ fontSize: 210, color: "#777150", fontFamily: "serif", fontStyle: "italic" }}>V&amp;H</span>
      </div>
    ),
    { ...size }
  );
}
