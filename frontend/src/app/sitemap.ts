import type { MetadataRoute } from "next";
import {
  getActiveCategoriesPage,
  getExploreTools,
  type CatalogCategory,
  type CatalogTool,
} from "@/lib/catalog-api";
import { canonicalUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

async function allActiveCategories(): Promise<CatalogCategory[]> {
  const first = await getActiveCategoriesPage(1);
  const categories = [...first.items];
  for (let start = 2; start <= first.total_pages; start += 4) {
    const pages = Array.from(
      { length: Math.min(4, first.total_pages - start + 1) },
      (_, index) => start + index,
    );
    const responses = await Promise.all(pages.map(getActiveCategoriesPage));
    for (const response of responses) categories.push(...response.items);
  }
  return categories;
}

async function allPublishedTools(): Promise<CatalogTool[]> {
  const first = await getExploreTools(
    new URLSearchParams({ page: "1", page_size: "100", sort: "newest" }),
  );
  const tools = [...first.items];
  for (let start = 2; start <= first.total_pages; start += 4) {
    const pages = Array.from(
      { length: Math.min(4, first.total_pages - start + 1) },
      (_, index) => start + index,
    );
    const responses = await Promise.all(
      pages.map((page) =>
        getExploreTools(
          new URLSearchParams({
            page: String(page),
            page_size: "100",
            sort: "newest",
          }),
        ),
      ),
    );
    for (const response of responses) tools.push(...response.items);
  }
  return tools;
}

function lastModified(value: string | undefined): Date {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categoriesResult, toolsResult] = await Promise.allSettled([
    allActiveCategories(),
    allPublishedTools(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: canonicalUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: canonicalUrl("/rankings"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: canonicalUrl("/methodology"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: canonicalUrl("/privacy"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: canonicalUrl("/terms"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  if (categoriesResult.status === "fulfilled" && categoriesResult.value.length) {
    entries.push({
      url: canonicalUrl("/categories"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const category of categoriesResult.value) {
      entries.push({
        url: canonicalUrl(`/categories/${encodeURIComponent(category.slug)}`),
        lastModified: lastModified(category.updated_at),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  if (toolsResult.status === "fulfilled") {
    for (const tool of toolsResult.value) {
      entries.push({
        url: canonicalUrl(`/tools/${encodeURIComponent(tool.slug)}`),
        lastModified: lastModified(tool.updated_at),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
