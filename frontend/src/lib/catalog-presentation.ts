import type { ToolCardData } from "@/components/tool/tool-card";
import type { CatalogCategory, CatalogTool } from "@/lib/catalog-api";
import { CURATED_TOOLS } from "./curated-tools";

export function toToolCardData(
  tool: CatalogTool,
  categories: CatalogCategory[],
): ToolCardData {
  const category = categories.find((item) => item.id === tool.primary_category_id);
  const curated = CURATED_TOOLS[tool.slug.toLowerCase().trim()];
  const startingPlan = curated?.pricing_plans?.find((p) => !p.is_free && p.amount_minor);
  const startingPrice = startingPlan && startingPlan.amount_minor
    ? `$${(startingPlan.amount_minor / 100).toFixed(0)}/mo`
    : undefined;

  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    tagline: tool.tagline || curated?.tagline || tool.description || "No short description supplied.",
    category: category?.name ?? curated?.primary_category?.name ?? "Uncategorized",
    categorySlug: category?.slug ?? curated?.primary_category?.slug ?? "",
    pricingModel: tool.pricing_model,
    websiteUrl: (tool as { website_url?: string }).website_url || curated?.website_url,
    startingPrice,
    isVerified: tool.is_verified ?? curated?.is_verified ?? true,
    isSponsored: tool.is_sponsored,
    score: curated ? 92 : undefined,
  };
}
