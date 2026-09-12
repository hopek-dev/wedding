import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background:
            "linear-gradient(135deg, #fb7185 0%, #fb923c 35%, #fbbf24 60%, #a78bfa 85%, #60a5fa 100%)",
        }}
      >
        <span style={{ fontSize: 100, color: "white", fontFamily: "sans-serif" }}>&#9829;</span>
      </div>
    ),
    { ...size }
  );
}
