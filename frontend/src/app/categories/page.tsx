import type { Metadata } from "next";
import { PageShell } from "@/components/common/page-shell";
import { CategoryCard } from "@/components/tool/category-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getActiveCategories, type CatalogCategory } from "@/lib/catalog-api";
import { canonicalUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const categories = await getActiveCategories();
    return {
      title: "AI Tool Categories",
      description: "Browse published AI tools by category and find products for your work.",
      alternates: { canonical: canonicalUrl("/categories") },
      robots: { index: categories.length > 0, follow: true },
    };
  } catch {
    return { title: "AI Tool Categories", robots: { index: false, follow: true } };
  }
}

export default async function CategoriesPage() {
  let categories: CatalogCategory[] | null;
  try {
    categories = await getActiveCategories();
  } catch {
    categories = null;
  }

  return (
    <PageShell breadcrumbs={[{ label: "Home", href: "/" }, { label: "Categories" }]}>
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          Browse the catalog
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          AI tools by category
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Choose a kind of work to see published tools, verified performance scores, and live pricing models.
        </p>
      </header>

      {categories === null ? (
        <ErrorState
          className="mt-10"
          title="Categories are temporarily unavailable"
          description="We couldn't load the published category list. Try again in a moment."
        />
      ) : categories.length ? (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              name={category.name}
              slug={category.slug}
              description={category.description ?? undefined}
              className="h-full min-h-[140px] transition-transform duration-200 hover:-translate-y-1"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-10"
          title="No categories are published yet"
          description="The category directory will appear here as the catalog is prepared."
        />
      )}
    </PageShell>
  );
}
