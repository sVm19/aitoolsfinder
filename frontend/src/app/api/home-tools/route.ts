import { NextResponse } from "next/server";
import { getHomeToolsPage } from "@/lib/home-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPage = Number(searchParams.get("page") || "1");
    const rawPageSize = Number(searchParams.get("pageSize") || "12");
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
    const pageSize = Number.isFinite(rawPageSize)
      ? Math.min(48, Math.max(1, Math.floor(rawPageSize)))
      : 12;
    const category = (searchParams.get("category") || "all").toLowerCase().trim() || "all";
    const pricing = (searchParams.get("pricing") || "all").toLowerCase().trim() || "all";

    const data = await getHomeToolsPage({ page, pageSize, category, pricing });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load tools." },
      { status: 500 }
    );
  }
}
