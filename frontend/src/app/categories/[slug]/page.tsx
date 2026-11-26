import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/common/page-shell";
import { ALL_CATEGORIES } from "@/components/category/category-data";
import { ToolCard } from "@/components/tool/tool-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategoryBySlug, type CatalogCategory } from "@/lib/catalog-api";
import { getHomeToolsPage } from "@/lib/home-catalog";
import { canonicalUrl } from "@/lib/site";
import { buildItemListJsonLd } from "@/lib/seo-schema";

type SearchParams = Record<string, string | string[] | undefined>;

function getPage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value ?? "1");
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

async function resolveCategory(slug: string): Promise<CatalogCategory | null> {
  try {
    const cat = await getCategoryBySlug(slug);
    if (cat?.is_active) return cat;
  } catch {
    // Fallback to static taxonomy list
  }
  const local = ALL_CATEGORIES.find((c) => c.slug === slug);
  if (!local) return null;
  return {
    id: `cat-${local.slug}`,
    name: local.name,
    slug: local.slug,
    description: local.description,
    seo_title: `${local.name} AI Tools`,
    seo_description: local.description,
    is_active: true,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategory(slug);
  if (!category) {
    return { title: "AI Tool Category", robots: { index: false, follow: true } };
  }
  return {
    title: category.seo_title ?? `${category.name} AI Tools`,
    description:
      category.seo_description ??
      category.description ??
      `Browse AI tools and SaaS products in ${category.name}.`,
    alternates: { canonical: canonicalUrl(`/categories/${encodeURIComponent(slug)}`) },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const category = await resolveCategory(slug);
  if (!category) notFound();

  const page = getPage(rawSearch.page);
  const { items, totalPages } = await getHomeToolsPage({
    category: slug,
    page,
    pageSize: 24,
  });

  const itemListJsonLd = buildItemListJsonLd(
    `${category.name} AI Tools`,
    category.description || category.seo_description,
    items.map((t, idx) => ({
      name: t.name,
      url: `/tools/${encodeURIComponent(t.slug)}`,
      description: t.tagline,
      position: (page - 1) * 24 + idx + 1,
    })),
  );

  const basePath = `/categories/${encodeURIComponent(slug)}`;

  return (
    <PageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Categories", href: "/categories" },
        { label: category.name },
      ]}
    >
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          AI tool category
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {category.name}
        </h1>
        {(category.description || category.seo_description) && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {category.description || category.seo_description}
          </p>
        )}
      </header>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            title={`No tools listed in ${category.name} yet`}
            description="Browse all categories or submit a tool to be listed here."
            action={
              <Link href="/categories">
                <Button variant="primary" size="md">
                  Back to categories
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((tool) => (
                <li key={tool.slug}>
                  <ToolCard tool={tool} className="h-full" />
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link href={`${basePath}?page=${page - 1}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </Link>
                )}
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={`${basePath}?page=${page + 1}`}>
                    <Button variant="outline" size="sm">Next</Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: itemListJsonLd }}
        />
      )}
    </PageShell>
  );
}
