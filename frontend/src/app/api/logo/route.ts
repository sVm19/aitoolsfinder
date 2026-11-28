import { NextRequest, NextResponse } from "next/server";

const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim().toLowerCase() ?? "";

  if (!domain || domain.length > 253 || !DOMAIN_RE.test(domain)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
      { next: { revalidate: 2_592_000 } }
    );

    if (!upstream.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/png";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
