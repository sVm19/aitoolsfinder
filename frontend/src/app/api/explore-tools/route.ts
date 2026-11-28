import { NextResponse } from "next/server";
import { searchExploreTools } from "@/lib/explore-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await searchExploreTools(searchParams);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to search published tools." },
      { status: 500 }
    );
  }
}
