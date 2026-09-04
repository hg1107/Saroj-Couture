import { ImageResponse } from "next/og";
import { BUSINESS } from "@/lib/utils/constants";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1b1713 0%, #15120f 50%, #0d0c0a 100%)",
          color: "#fcf9f4",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 28,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#e8d5c4",
            marginBottom: 28,
          }}
        >
          <div style={{ width: 64, height: 1, background: "#e8d5c4" }} />
          <span>Haute Atelier &bull; Nagpur</span>
          <div style={{ width: 64, height: 1, background: "#e8d5c4" }} />
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "serif",
            fontSize: 96,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {BUSINESS.name}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "serif",
            fontStyle: "italic",
            fontSize: 34,
            color: "#e8d5c4",
            marginTop: 24,
          }}
        >
          {BUSINESS.tagline}
        </div>
      </div>
    ),
    { ...size }
  );
}
