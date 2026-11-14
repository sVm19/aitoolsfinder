import { NextResponse } from "next/server";
import { CURATED_TOOLS } from "@/lib/curated-tools";
import { getToolBySlug } from "@/lib/catalog-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const normalized = slug.toLowerCase().trim();

  // 1. Check curated tools first for instant redirect
  const curated = CURATED_TOOLS[normalized];
  if (curated?.website_url) {
    return NextResponse.redirect(curated.website_url, { status: 307 });
  }

  // 2. Try fetching from catalog API
  try {
    const tool = await getToolBySlug(slug);
    if (tool.website_url) {
      return NextResponse.redirect(tool.website_url, { status: 307 });
    }
  } catch {
    // ignore fetch error
  }

  // 3. Fallback to tool profile or explore
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/tools/${encodeURIComponent(slug)}`, {
    status: 307,
  });
}
