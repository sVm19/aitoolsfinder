import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";
import { getHomeToolsPage } from "@/lib/home-catalog";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "AIToolsFinder — Browse AI Tools & SaaS Products",
  description:
    "Scroll and discover verified AI tools and SaaS products from YC, GitHub, and Product Hunt. Compare pricing models, features, and capabilities side by side.",
  alternates: {
    canonical: canonicalUrl("/"),
  },
};

const VALID_PRICING = new Set(["all", "free", "freemium", "paid"]);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; pricing?: string; page?: string }>;
}) {
  const raw = await searchParams;
  const category = (raw.category || "all").toLowerCase().trim() || "all";
  const rawPricing = (raw.pricing || "all").toLowerCase().trim();
  const pricing = VALID_PRICING.has(rawPricing) ? rawPricing : "all";
  const parsedPage = Number(raw.page || "1");
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1;

  const initialData = await getHomeToolsPage({
    page,
    pageSize: 12,
    category,
    pricing,
  });

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AIToolsFinder",
    url: canonicalUrl("/"),
    description: "Browse and compare AI tools and SaaS products.",
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AIToolsFinder",
    url: canonicalUrl("/"),
    logo: canonicalUrl("/brand/brand-symbol.svg"),
    description: "AI Tool Intelligence Platform",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HomeView
        initialTools={initialData.items}
        initialTotal={initialData.total}
        initialPage={initialData.page}
        initialTotalPages={initialData.totalPages}
        initialCategory={category}
        initialPricing={pricing}
      />
    </>
  );
}
