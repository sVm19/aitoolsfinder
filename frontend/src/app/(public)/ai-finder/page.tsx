import type { Metadata } from "next";
import { getActiveCategories, type CatalogCategory } from "@/lib/catalog-api";
import { canonicalUrl } from "@/lib/site";
import { AIFinderView } from "./view";

export const metadata: Metadata = {
  title: "AI Tool Finder",
  description:
    "Describe your task and get catalog-grounded AI tool recommendations with verified pricing and clear tradeoffs.",
  alternates: { canonical: canonicalUrl("/ai-finder") },
};

export default async function AIFinderPage() {
  const categoriesResult = await getActiveCategories().catch(() => null);
  const categories: CatalogCategory[] = categoriesResult ?? [];

  return <AIFinderView categories={categories} />;
}