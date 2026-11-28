import fs from "node:fs";
import path from "node:path";
import type { ToolCardData } from "@/components/tool/tool-card";
import { CURATED_CATEGORIES, CURATED_TOOLS } from "@/lib/curated-tools";
import type { CatalogTool, PaginatedResponse } from "@/lib/catalog-api";
import { toToolCardData } from "@/lib/catalog-presentation";

interface EnrichedRow {
  name: string;
  slug: string;
  website_url: string;
  tagline?: string;
  description?: string;
  primary_category_slug?: string;
  pricing_model?: ToolCardData["pricingModel"];
  pricing_plans?: Array<{ is_free?: boolean; amount_minor?: number | null }>;
}

const DAILY_SHUFFLE_HOUR_UTC = Number(process.env.HOME_SHUFFLE_HOUR_UTC ?? "0");

export function getDailyShuffleSeed(nowMs: number = Date.now()): number {
  const offsetMs = DAILY_SHUFFLE_HOUR_UTC * 3_600_000;
  return Math.floor((nowMs - offsetMs) / 86_400_000);
}

export function dailyShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed | 0;
  const nextRand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

let cachedLocalTools: { mtimeMs: number; tools: ToolCardData[] } | null = null;
let cachedShuffled: { seed: number; mtimeMs: number; tools: ToolCardData[] } | null = null;
let backendCircuitOpenUntil = 0;

const BACKEND_TIMEOUT_MS = 1500;
const BACKEND_CIRCUIT_COOLDOWN_MS = 30_000;

export function readLocalEnrichedTools(): { tools: ToolCardData[]; mtimeMs: number } {
  const candidates = [
    path.resolve(process.cwd(), "..", "data", "enriched.jsonl"),
    path.resolve(process.cwd(), "data", "enriched.jsonl"),
    path.resolve(process.cwd(), "..", "data", "enriched_sample.jsonl"),
  ];

  let resolvedPath: string | null = null;
  let mtimeMs = 0;
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      resolvedPath = filePath;
      mtimeMs = fs.statSync(filePath).mtimeMs;
      break;
    }
  }

  if (cachedLocalTools && cachedLocalTools.mtimeMs === mtimeMs) {
    return { tools: cachedLocalTools.tools, mtimeMs };
  }

  const bySlug = new Map<string, ToolCardData>();

  for (const curated of Object.values(CURATED_TOOLS)) {
    bySlug.set(curated.slug, toToolCardData(curated, Object.values(CURATED_CATEGORIES)));
  }

  if (resolvedPath) {
    const lines = fs.readFileSync(resolvedPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line) as EnrichedRow;
        if (!row.slug || !row.name || bySlug.has(row.slug)) continue;
        const catSlug = (row.primary_category_slug || "ai").toLowerCase();
        const cat = CURATED_CATEGORIES[catSlug];
        const paidPlan = row.pricing_plans?.find((p) => !p.is_free && p.amount_minor);
        bySlug.set(row.slug, {
          id: `seed-${row.slug}`,
          name: row.name,
          slug: row.slug,
          tagline: row.tagline || row.description || "Verified AI & SaaS product.",
          category: cat?.name || catSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          categorySlug: catSlug,
          pricingModel: row.pricing_model || "unknown",
          websiteUrl: row.website_url,
          startingPrice: paidPlan?.amount_minor ? `$${Math.round(paidPlan.amount_minor / 100)}/mo` : undefined,
          isVerified: false,
        });
      } catch {
        // Ignore malformed line
      }
    }
  }

  const tools = Array.from(bySlug.values());
  cachedLocalTools = { mtimeMs, tools };
  return { tools, mtimeMs };
}

function getDailyLocalTools(): ToolCardData[] {
  const seed = getDailyShuffleSeed();
  const { tools, mtimeMs } = readLocalEnrichedTools();
  if (
    cachedShuffled &&
    cachedShuffled.seed === seed &&
    cachedShuffled.mtimeMs === mtimeMs
  ) {
    return cachedShuffled.tools;
  }
  const shuffled = dailyShuffle(tools, seed);
  cachedShuffled = { seed, mtimeMs, tools: shuffled };
  return shuffled;
}

export async function getHomeToolsPage({
  page = 1,
  pageSize = 12,
  category = "all",
  pricing = "all",
}: {
  page?: number;
  pageSize?: number;
  category?: string;
  pricing?: string;
}): Promise<{
  items: ToolCardData[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const normalizedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const normalizedPageSize = Number.isFinite(pageSize)
    ? Math.min(48, Math.max(1, Math.floor(pageSize)))
    : 12;
  const normalizedCategory = (category || "all").toLowerCase().trim() || "all";
  const normalizedPricing = (pricing || "all").toLowerCase().trim() || "all";

  const apiBase = (
    process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ""
  ).replace(/\/+$/, "");

  if (apiBase && Date.now() >= backendCircuitOpenUntil) {
    try {
      const params = new URLSearchParams({
        page: String(normalizedPage),
        page_size: String(normalizedPageSize),
        sort: "newest",
      });
      if (normalizedCategory !== "all") params.set("category", normalizedCategory);
      if (normalizedPricing !== "all") params.set("pricing_model", normalizedPricing);

      const response = await fetch(`${apiBase}/tools?${params.toString()}`, {
        signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
        cache: "no-store",
      });

      if (response.ok) {
        const res = (await response.json()) as PaginatedResponse<CatalogTool>;
        const isFiltered =
          normalizedCategory !== "all" || normalizedPricing !== "all";
        const hasFullCatalog = res.total > Object.keys(CURATED_TOOLS).length;
        if (isFiltered || (res.items.length > 0 && hasFullCatalog)) {
          const cats = Object.values(CURATED_CATEGORIES);
          const total = Math.max(0, res.total);
          const totalPages = Math.max(1, Math.ceil(total / normalizedPageSize));
          const safePage = Math.min(Math.max(1, res.page || normalizedPage), totalPages);
          return {
            items: res.items.map((t) => toToolCardData(t, cats)),
            total,
            page: safePage,
            totalPages,
          };
        }
      }
      // Backend returned error or unseeded catalog; trip circuit breaker briefly
      backendCircuitOpenUntil = Date.now() + BACKEND_CIRCUIT_COOLDOWN_MS;
    } catch {
      // Backend unreachable or timed out; trip circuit breaker and fall back
      backendCircuitOpenUntil = Date.now() + BACKEND_CIRCUIT_COOLDOWN_MS;
    }
  }

  let allTools = getDailyLocalTools();
  if (normalizedCategory !== "all") {
    allTools = allTools.filter(
      (t) => t.categorySlug.toLowerCase().trim() === normalizedCategory
    );
  }
  if (normalizedPricing !== "all") {
    allTools = allTools.filter(
      (t) => t.pricingModel.toLowerCase().trim() === normalizedPricing
    );
  }

  const total = allTools.length;
  const totalPages = Math.max(1, Math.ceil(total / normalizedPageSize));
  const safePage = Math.min(Math.max(1, normalizedPage), totalPages);
  const start = (safePage - 1) * normalizedPageSize;

  return {
    items: allTools.slice(start, start + normalizedPageSize),
    total,
    page: safePage,
    totalPages,
  };
}
