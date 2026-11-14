import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

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
          background: "#030206",
          borderRadius: "7px",
          border: "1px solid rgba(124, 58, 237, 0.45)",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 256 256"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Vanguard Facet */}
          <path
            d="M124 26 L24 206 L66 206 L124 104 Z"
            fill="#8B5CF6"
          />
          {/* Right Vanguard Facet */}
          <path
            d="M132 26 L132 104 L190 206 L232 206 Z"
            fill="#FF5E1E"
          />
          {/* Precision Diamond Aperture */}
          <polygon
            points="128,138 152,162 128,186 104,162"
            fill="#FF5E1E"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
