import { ImageResponse } from "next/og";
import { getToolBySlug } from "@/lib/catalog-api";

export const runtime = "edge";
export const alt = "AI tool profile on AIToolsFinder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug).catch(() => null);
  const title = tool?.name ?? "Find the right AI tool";
  const subtitle = tool?.tagline || tool?.description || "Published tools, sourced details, transparent choices.";
  const category = tool?.primary_category?.name;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "#F7F5FA",
          background: "linear-gradient(135deg, #010102 0%, #100A20 58%, #1A102C 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#121018",
              border: "1px solid #302A3A",
            }}
          >
            <svg width="32" height="32" viewBox="16 16 224 224" fill="none">
              <path
                fill="#8B5CF6"
                fillRule="evenodd"
                d="M128 20 C187.646 20 236 68.354 236 128 C236 187.646 187.646 236 128 236 C68.354 236 20 187.646 20 128 C20 68.354 68.354 20 128 20 Z M128 36 C77.19 36 36 77.19 36 128 C36 178.81 77.19 220 128 220 C178.81 220 220 178.81 220 128 C220 77.19 178.81 36 128 36 Z"
              />
              <path fill="#FF5E1E" d="M128 64 L180 94 L128 124 L76 94 Z" />
              <path fill="#8B5CF6" d="M76 118 L128 148 L180 118 L180 134 L128 164 L76 134 Z" />
              <path fill="#8B5CF6" d="M76 152 L128 182 L180 152 L180 168 L128 198 L76 168 Z" />
            </svg>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>AIToolsFinder</div>
          <div style={{ marginLeft: "auto", color: "#C4A3FD", fontSize: 16, letterSpacing: 3 }}>
            PUBLISHED TOOL PROFILE
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1010 }}>
          <div style={{ fontSize: title.length > 26 ? 60 : 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, overflow: "hidden" }}>
            {title}
          </div>
          <div style={{ color: "#B5ADBF", fontSize: 28, lineHeight: 1.35, maxHeight: 110, overflow: "hidden" }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {category && (
            <div style={{ border: "1px solid #4B3C62", borderRadius: 999, color: "#D6C2FA", padding: "10px 18px", fontSize: 18 }}>
              {category}
            </div>
          )}
          <div style={{ marginLeft: "auto", color: "#948CA0", fontSize: 18 }}>
            aitoolsfinder.cloud
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
