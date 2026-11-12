import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/site";
import { ExploreView, type ExploreFilters } from "./view";
import {
  getActiveCategories,
  getExploreTools,
  type CatalogCategory,
  type PaginatedResponse,
  type CatalogTool,
} from "@/lib/catalog-api";

type SearchParams = Record<string, string | string[] | undefined>;

function values(value: string | string[] | undefined): string[] {
  return (Array.isArray(value) ? value : value ? [value] : [])
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function scalar(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const metadata: Metadata = {
  title: "Explore AI Tools",
  description: "Search and filter published AI tools by category, pricing, and verification.",
  alternates: { canonical: canonicalUrl("/explore") },
  robots: { index: false, follow: true },
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const raw = await searchParams;
  const q = scalar(raw.q) ?? "";
  const requestedSort = scalar(raw.sort) ?? "newest";
  const filters: ExploreFilters = {
    q,
    categories: [...new Set(values(raw.category))],
    pricing: scalar(raw.pricing_model) ?? "",
    verified: scalar(raw.is_verified) === "true",
    sort:
      ["newest", "alphabetical", "relevance"].includes(requestedSort) &&
      (requestedSort !== "relevance" || Boolean(q.trim()))
        ? requestedSort
        : "newest",
  };
  const pageValue = Number(scalar(raw.page) ?? "1");
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  const apiParams = new URLSearchParams({ page: String(page), page_size: "24" });
  if (filters.q.trim()) apiParams.set("q", filters.q.trim());
  for (const category of filters.categories) apiParams.append("category", category);
  if (filters.pricing) apiParams.set("pricing_model", filters.pricing);
  if (filters.verified) apiParams.set("is_verified", "true");
  if (scalar(raw.sort)) apiParams.set("sort", filters.sort);

  const [toolsResult, categoriesResult] = await Promise.allSettled([
    getExploreTools(apiParams),
    getActiveCategories(),
  ]);
  const results =
    toolsResult.status === "fulfilled"
      ? toolsResult.value
      : ({ items: [], page, page_size: 24, total: 0, total_pages: 0 } satisfies PaginatedResponse<CatalogTool>);
  const categories: CatalogCategory[] =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];

  return (
    <ExploreView
      initialFilters={filters}
      page={page}
      results={results}
      categories={categories}
      loadError={toolsResult.status === "rejected"}
    />
  );
}
