import fs from "node:fs";
import path from "node:path";
import type { CatalogTool, PaginatedResponse } from "@/lib/catalog-api";
import { CURATED_CATEGORIES, CURATED_TOOLS } from "@/lib/curated-tools";

interface EnrichedSearchRow {
  name: string;
  slug: string;
  website_url?: string;
  tagline?: string;
  description?: string;
  primary_category_slug?: string;
  pricing_model?: CatalogTool["pricing_model"];
  tags?: string[];
  features?: string[];
}

interface SearchableCatalogEntry {
  tool: CatalogTool;
  categorySlug: string;
  searchText: string;
  nameLower: string;
}

let cachedEntries: { mtimeMs: number; items: SearchableCatalogEntry[] } | null = null;
let backendCircuitOpenUntil = 0;

function readSearchableLocalCatalog(): SearchableCatalogEntry[] {
  const candidates = [
    path.resolve(process.cwd(), "..", "data", "enriched.jsonl"),
    path.resolve(process.cwd(), "data", "enriched.jsonl"),
    path.resolve(process.cwd(), "..", "data", "enriched_sample.jsonl"),
  ];

  let resolvedPath: string | null = null;
  let mtimeMs = 0;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      resolvedPath = candidate;
      mtimeMs = fs.statSync(candidate).mtimeMs;
      break;
    }
  }

  if (cachedEntries && cachedEntries.mtimeMs === mtimeMs) {
    return cachedEntries.items;
  }

  const bySlug = new Map<string, SearchableCatalogEntry>();

  for (const t of Object.values(CURATED_TOOLS)) {
    const catSlug = (t.primary_category?.slug || "ai").toLowerCase();
    const catName = t.primary_category?.name || catSlug;
    const tagNames = (t.tags || []).map((tag) => `${tag.name} ${tag.slug}`).join(" ");
    const featureNames = (t.features || [])
      .map((f) => `${f.feature.name} ${f.feature.description || ""} ${f.notes || ""}`)
      .join(" ");

    bySlug.set(t.slug, {
      tool: {
        id: t.id,
        name: t.name,
        slug: t.slug,
        tagline: t.tagline,
        description: t.description,
        primary_category_id: t.primary_category_id,
        pricing_model: t.pricing_model,
        is_verified: t.is_verified,
        is_sponsored: t.is_sponsored,
        launched_at: t.launched_at,
        updated_at: t.updated_at,
      },
      categorySlug: catSlug,
      nameLower: t.name.toLowerCase(),
      searchText: [
        t.name,
        t.slug,
        t.tagline || "",
        t.description || "",
        catName,
        catSlug,
        tagNames,
        featureNames,
      ]
        .join(" ")
        .toLowerCase(),
    });
  }

  if (resolvedPath) {
    const lines = fs.readFileSync(resolvedPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line) as EnrichedSearchRow;
        if (!row.slug || !row.name || bySlug.has(row.slug)) continue;
        const catSlug = (row.primary_category_slug || "ai").toLowerCase().trim();
        const cat = CURATED_CATEGORIES[catSlug];
        const catName = cat?.name || catSlug.replace(/-/g, " ");
        const extraTags = Array.isArray(row.tags) ? row.tags.join(" ") : "";
        const extraFeatures = Array.isArray(row.features) ? row.features.join(" ") : "";

        bySlug.set(row.slug, {
          tool: {
            id: `seed-${row.slug}`,
            name: row.name,
            slug: row.slug,
            tagline: row.tagline || null,
            description: row.description || null,
            primary_category_id: cat?.id || null,
            pricing_model: row.pricing_model || "unknown",
            is_verified: false,
            is_sponsored: false,
            launched_at: null,
            updated_at: new Date(0).toISOString(),
          },
          categorySlug: catSlug,
          nameLower: row.name.toLowerCase(),
          searchText: [
            row.name,
            row.slug,
            row.tagline || "",
            row.description || "",
            catName,
            catSlug,
            extraTags,
            extraFeatures,
          ]
            .join(" ")
            .toLowerCase(),
        });
      } catch {
        // Ignore malformed line
      }
    }
  }

  const items = Array.from(bySlug.values());
  cachedEntries = { mtimeMs, items };
  return items;
}

export async function searchExploreTools(
  params: URLSearchParams
): Promise<PaginatedResponse<CatalogTool>> {
  const rawPage = Number(params.get("page") || "1");
  const rawPageSize = Number(params.get("page_size") || "24");
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(100, Math.max(1, Math.floor(rawPageSize)))
    : 24;

  const q = (params.get("q") || "").trim();
  const categories = params
    .getAll("category")
    .flatMap((c) => c.split(","))
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  const pricing = (params.get("pricing_model") || "").trim().toLowerCase();
  const verifiedOnly = params.get("is_verified") === "true";
  const sort = (params.get("sort") || "newest").trim().toLowerCase();

  const apiBase = (
    process.env.INTERNAL_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ""
  ).replace(/\/+$/, "");

  if (apiBase && Date.now() >= backendCircuitOpenUntil) {
    try {
      const upstream = new URLSearchParams(params);
      if (q) upstream.set("q", q);
      const response = await fetch(`${apiBase}/tools?${upstream.toString()}`, {
        signal: AbortSignal.timeout(1800),
        cache: "no-store",
      });
      if (response.ok) {
        const res = (await response.json()) as PaginatedResponse<CatalogTool>;
        const isUnfiltered = !q && categories.length === 0 && !pricing && !verifiedOnly;
        if (!isUnfiltered || res.total > Object.keys(CURATED_TOOLS).length) {
          return res;
        }
      }
      backendCircuitOpenUntil = Date.now() + 30_000;
    } catch {
      backendCircuitOpenUntil = Date.now() + 30_000;
    }
  }

  const words = q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  let matches = readSearchableLocalCatalog();

  if (categories.length > 0) {
    const allowed = new Set(categories);
    matches = matches.filter((entry) => allowed.has(entry.categorySlug));
  }

  if (pricing && pricing !== "all") {
    matches = matches.filter(
      (entry) => entry.tool.pricing_model.toLowerCase() === pricing
    );
  }

  if (verifiedOnly) {
    matches = matches.filter((entry) => entry.tool.is_verified);
  }

  if (words.length > 0) {
    matches = matches.filter((entry) =>
      words.every((word) => entry.searchText.includes(word))
    );
  }

  const sorted = [...matches];
  if (sort === "alphabetical") {
    sorted.sort((a, b) => a.nameLower.localeCompare(b.nameLower));
  } else if (sort === "relevance" && words.length > 0) {
    const phrase = q.toLowerCase();
    sorted.sort((a, b) => {
      const aExact = a.nameLower.includes(phrase) ? 2 : 0;
      const bExact = b.nameLower.includes(phrase) ? 2 : 0;
      const aWordInName = words.filter((w) => a.nameLower.includes(w)).length;
      const bWordInName = words.filter((w) => b.nameLower.includes(w)).length;
      const diff = bExact + bWordInName - (aExact + aWordInName);
      if (diff !== 0) return diff;
      return a.nameLower.localeCompare(b.nameLower);
    });
  } else {
    sorted.sort((a, b) => {
      if (a.tool.is_sponsored !== b.tool.is_sponsored) {
        return a.tool.is_sponsored ? -1 : 1;
      }
      if (a.tool.is_verified !== b.tool.is_verified) {
        return a.tool.is_verified ? -1 : 1;
      }
      return a.nameLower.localeCompare(b.nameLower);
    });
  }

  const total = sorted.length;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize).map((entry) => entry.tool),
    page: safePage,
    page_size: pageSize,
    total,
    total_pages: totalPages,
  };
}
