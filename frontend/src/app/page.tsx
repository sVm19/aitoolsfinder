import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";
import { getHomeToolsPage } from "@/lib/home-catalog";
import { canonicalUrl } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AIToolsFinder — Browse AI Tools & SaaS Products",
  description:
    "Scroll and discover verified AI tools and SaaS products from YC, GitHub, and Product Hunt. Compare pricing models, features, and capabilities side by side.",
  alternates: {
    canonical: canonicalUrl("/"),
  },
};

export default async function HomePage() {
  const initialData = await getHomeToolsPage({ page: 1, pageSize: 24 });

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
        initialTotalPages={initialData.totalPages}
      />
    </>
  );
}
