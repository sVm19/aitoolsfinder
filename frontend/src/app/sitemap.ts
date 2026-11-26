import type { MetadataRoute } from "next";
import {
  getActiveCategoriesPage,
  getActiveTags,
  getExploreTools,
  type CatalogCategory,
  type CatalogTag,
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

const FEATURED_COMPARISON_SLUGS = [
  "midjourney-vs-stable-diffusion",
  "claude-vs-chatgpt",
  "cursor-vs-github-copilot",
  "elevenlabs-vs-murf-ai",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categoriesResult, toolsResult, tagsResult] = await Promise.allSettled([
    allActiveCategories(),
    allPublishedTools(),
    getActiveTags().catch(() => [] as CatalogTag[]),
  ]);

  const entriesByUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  const addEntry = (entry: MetadataRoute.Sitemap[number]) => {
    if (!entriesByUrl.has(entry.url)) {
      entriesByUrl.set(entry.url, entry);
    }
  };

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: canonicalUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: canonicalUrl("/explore"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: canonicalUrl("/rankings"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: canonicalUrl("/categories"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: canonicalUrl("/compare"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: canonicalUrl("/ai-finder"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: canonicalUrl("/submit"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: canonicalUrl("/vendor"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: canonicalUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: canonicalUrl("/methodology"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: canonicalUrl("/transparency"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: canonicalUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: canonicalUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  for (const entry of staticRoutes) {
    addEntry(entry);
  }

  for (const slug of FEATURED_COMPARISON_SLUGS) {
    addEntry({
      url: canonicalUrl(`/compare/${encodeURIComponent(slug)}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  if (categoriesResult.status === "fulfilled" && categoriesResult.value.length) {
    for (const category of categoriesResult.value) {
      const modDate = lastModified(category.updated_at);
      // Category hub
      addEntry({
        url: canonicalUrl(`/categories/${encodeURIComponent(category.slug)}`),
        lastModified: modDate,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      // Category rankings
      addEntry({
        url: canonicalUrl(`/rankings/${encodeURIComponent(category.slug)}`),
        lastModified: modDate,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  if (toolsResult.status === "fulfilled" && toolsResult.value.length) {
    for (const tool of toolsResult.value) {
      const modDate = lastModified(tool.updated_at);
      // Tool detail
      addEntry({
        url: canonicalUrl(`/tools/${encodeURIComponent(tool.slug)}`),
        lastModified: modDate,
        changeFrequency: "weekly",
        priority: 0.7,
      });
      // Alternatives page
      addEntry({
        url: canonicalUrl(`/alternatives/${encodeURIComponent(tool.slug)}`),
        lastModified: modDate,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  if (tagsResult.status === "fulfilled" && tagsResult.value.length) {
    for (const tag of tagsResult.value) {
      addEntry({
        url: canonicalUrl(`/tags/${encodeURIComponent(tag.slug)}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return Array.from(entriesByUrl.values());
}
