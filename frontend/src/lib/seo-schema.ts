import { canonicalUrl } from "./site";
import type { CatalogPricingPlan, CatalogToolDetail } from "./catalog-api";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): string {
  const itemListElement = items.map((item, index) => {
    const entry: Record<string, unknown> = {
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
    };
    if (item.href) {
      entry.item = item.href.startsWith("http")
        ? item.href
        : canonicalUrl(item.href.startsWith("/") ? (item.href as `/${string}`) : (`/${item.href}` as `/${string}`));
    }
    return entry;
  });

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };

  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

export interface ListItemData {
  name: string;
  url: string;
  description?: string | null;
  position?: number;
}

export function buildItemListJsonLd(
  title: string,
  description: string | null | undefined,
  items: ListItemData[],
): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    ...(description ? { description } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: item.position ?? index + 1,
      name: item.name,
      url: item.url.startsWith("http")
        ? item.url
        : canonicalUrl(item.url.startsWith("/") ? (item.url as `/${string}`) : (`/${item.url}` as `/${string}`)),
      ...(item.description ? { description: item.description } : {}),
    })),
  };

  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildSoftwareApplicationJsonLd(tool: CatalogToolDetail): string {
  const websiteUrl = safeHttpUrl(tool.website_url);
  const offers = tool.pricing_plans
    .filter((plan) => plan.is_free || plan.amount_minor !== null)
    .map((plan: CatalogPricingPlan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.is_free
        ? "0"
        : (
            plan.amount_minor! /
            10 **
              (new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: plan.currency ?? "USD",
              }).resolvedOptions().maximumFractionDigits ?? 2)
          ).toString(),
      priceCurrency: plan.currency ?? "USD",
      ...(safeHttpUrl(plan.pricing_url) ? { url: safeHttpUrl(plan.pricing_url) } : {}),
    }));

  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    ...(websiteUrl ? { url: websiteUrl } : {}),
    ...(tool.tagline || tool.description
      ? { description: tool.description || tool.tagline }
      : {}),
    ...(tool.primary_category?.name
      ? { applicationCategory: tool.primary_category.name }
      : {}),
    ...(offers.length ? { offers } : {}),
  };

  return JSON.stringify(data).replace(/</g, "\\u003c");
}
