import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "AIToolsFinder — Find the Best AI Tool For Your Exact Job",
  description:
    "Discover, compare, and evaluate 1,200+ verified AI tools and B2B SaaS platforms. Audited pricing, capability teardowns, alternatives, and intelligence scores.",
  alternates: {
    canonical: canonicalUrl("/"),
  },
};

export default function HomePage() {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AIToolsFinder",
    url: canonicalUrl("/"),
    description: "Find the best AI tool for your exact job.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${canonicalUrl("/explore")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AIToolsFinder",
    url: canonicalUrl("/"),
    logo: canonicalUrl("/brand/logo.svg"),
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
      <HomeView />
    </>
  );
}
