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
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#7022FC",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            AI
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
