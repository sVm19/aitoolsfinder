import type { Metadata } from "next";
import { PageShell } from "@/components/common/page-shell";
import { CategoryExplorer } from "@/components/category/category-explorer";
import { canonicalUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "AI Tool Categories · 40+ Curated Directories",
    description: "Browse 40+ verified AI tool categories with live pricing, feature proofs, and direct comparisons.",
    alternates: { canonical: canonicalUrl("/categories") },
    robots: { index: true, follow: true },
  };
}

export default function CategoriesPage() {
  return (
    <PageShell breadcrumbs={[{ label: "Home", href: "/" }, { label: "Categories" }]}>
      <header className="max-w-3xl mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          Directory Taxonomy · 40+ Curated Categories
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Find AI tools by category
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Filter by workflow, team function, or task to find verified AI tools with audited plan pricing and zero sponsor bias.
        </p>
      </header>

      <CategoryExplorer initialExpanded={true} />
    </PageShell>
  );
}
