import type { ToolCardData } from "@/components/tool/tool-card";
import type { CatalogCategory, CatalogTool } from "@/lib/catalog-api";

export function toToolCardData(
  tool: CatalogTool,
  categories: CatalogCategory[],
): ToolCardData {
  const category = categories.find((item) => item.id === tool.primary_category_id);
  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    tagline: tool.tagline || tool.description || "No short description supplied.",
    category: category?.name ?? "Uncategorized",
    categorySlug: category?.slug ?? "",
    pricingModel: tool.pricing_model,
    isVerified: tool.is_verified,
    isSponsored: tool.is_sponsored,
  };
}
