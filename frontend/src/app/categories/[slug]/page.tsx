import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { CatalogToolGrid } from "@/components/tool/catalog-tool-grid";
import { ErrorState } from "@/components/ui/error-state";
import {
  CatalogApiError,
  getActiveCategories,
  getCategoryBySlug,
  getExploreTools,
  type CatalogCategory,
} from "@/lib/catalog-api";
import { canonicalUrl } from "@/lib/site";

type SearchParams = Record<string, string | string[] | undefined>;

function getPage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value ?? "1");
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [category, tools] = await Promise.all([
      getCategoryBySlug(slug),
      getExploreTools(new URLSearchParams({ category: slug, page_size: "1" })),
    ]);
    return {
      title: category.seo_title ?? `${category.name} AI Tools`,
      description:
        category.seo_description ??
        category.description ??
        `Browse published AI tools in ${category.name} and compare their available details.`,
      alternates: { canonical: canonicalUrl(`/categories/${encodeURIComponent(slug)}`) },
      robots: { index: category.is_active && tools.total > 0, follow: true },
      openGraph: {
        title: `${category.seo_title ?? `${category.name} AI Tools`} | AIToolsFinder`,
        description:
          category.seo_description ??
          category.description ??
          `Browse published AI tools in ${category.name}.`,
        url: canonicalUrl(`/categories/${encodeURIComponent(slug)}`),
        type: "website",
      },
    };
  } catch {
    return {
      title: "AI Tool Category",
      robots: { index: false, follow: true },
    };
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  let category: CatalogCategory;
  try {
    category = await getCategoryBySlug(slug);
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) notFound();
    return (
      <PublicErrorPage
        title="Category details are temporarily unavailable"
        description="We couldn't load this category from the catalog. Try again in a moment."
      />
    );
  }
  if (!category.is_active) notFound();

  const page = getPage(rawSearch.page);
  const [toolsResult, categoriesResult] = await Promise.allSettled([
    getExploreTools(new URLSearchParams({ category: slug, page: String(page), page_size: "24" })),
    getActiveCategories(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories", href: "/categories" }, { label: category.name }]} />
          <header className="mt-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">AI tool category</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{category.name} AI tools</h1>
            {(category.description || category.seo_description) && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{category.description || category.seo_description}</p>}
          </header>
          {toolsResult.status === "rejected" ? (
            <ErrorState className="mt-10" title="Tools are temporarily unavailable" description="We couldn't load the published tools in this category. Try again in a moment." />
          ) : (
            <CatalogToolGrid
              tools={toolsResult.value.items}
              categories={categoriesResult.status === "fulfilled" ? categoriesResult.value : [category]}
              total={toolsResult.value.total}
              page={toolsResult.value.page}
              totalPages={toolsResult.value.total_pages}
              basePath={`/categories/${encodeURIComponent(slug)}`}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PublicErrorPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
        <ErrorState className="w-full" title={title} description={description} />
      </main>
      <Footer />
    </div>
  );
}
