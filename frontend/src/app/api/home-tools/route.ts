import { NextResponse } from "next/server";
import { getHomeToolsPage } from "@/lib/home-catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Math.min(48, Math.max(1, Number(searchParams.get("pageSize") || "24")));
  const category = (searchParams.get("category") || "all").toLowerCase().trim();
  const pricing = (searchParams.get("pricing") || "all").toLowerCase().trim();

  const data = await getHomeToolsPage({ page, pageSize, category, pricing });
  return NextResponse.json(data);
}
