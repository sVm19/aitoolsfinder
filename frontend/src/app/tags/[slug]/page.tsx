import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/common/page-shell";
import { CatalogToolGrid } from "@/components/tool/catalog-tool-grid";
import { ErrorState } from "@/components/ui/error-state";
import {
  CatalogApiError,
  getActiveCategories,
  getExploreTools,
  getTagBySlug,
  type CatalogTag,
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
    const [tag, tools] = await Promise.all([
      getTagBySlug(slug),
      getExploreTools(new URLSearchParams({ tags: slug, page_size: "1" })),
    ]);
    return {
      title: `${tag.name} AI Tools`,
      description: `Browse published AI tools tagged ${tag.name} and compare their available product details.`,
      alternates: { canonical: canonicalUrl(`/tags/${encodeURIComponent(slug)}`) },
      robots: { index: tools.total > 0, follow: true },
      openGraph: {
        title: `${tag.name} AI Tools | AIToolsFinder`,
        description: `Browse published AI tools tagged ${tag.name}.`,
        url: canonicalUrl(`/tags/${encodeURIComponent(slug)}`),
        type: "website",
      },
    };
  } catch {
    return { title: "AI Tool Tag", robots: { index: false, follow: true } };
  }
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  let tag: CatalogTag;
  try {
    tag = await getTagBySlug(slug);
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) notFound();
    return (
      <PublicErrorPage
        title="Tag details are temporarily unavailable"
        description="We couldn't load this tag from the catalog. Try again in a moment."
      />
    );
  }

  const page = getPage(rawSearch.page);
  const [toolsResult, categoriesResult] = await Promise.allSettled([
    getExploreTools(new URLSearchParams({ tags: slug, page: String(page), page_size: "24" })),
    getActiveCategories(),
  ]);

  return (
    <PageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Explore", href: "/explore" }, { label: tag.name }]}
    >
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">AI tool tag</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{tag.name} AI tools</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Published tools associated with the {tag.name} tag. Compare their verified details, pricing models, and performance scores.
        </p>
      </header>
      <div className="mt-8">
        {toolsResult.status === "rejected" ? (
          <ErrorState className="mt-10" title="Tools are temporarily unavailable" description="We couldn't load the published tools with this tag. Try again in a moment." />
        ) : (
          <CatalogToolGrid
            tools={toolsResult.value.items}
            categories={categoriesResult.status === "fulfilled" ? categoriesResult.value : []}
            total={toolsResult.value.total}
            page={toolsResult.value.page}
            totalPages={toolsResult.value.total_pages}
            basePath={`/tags/${encodeURIComponent(slug)}`}
          />
        )}
      </div>
    </PageShell>
  );
}

function PublicErrorPage({ title, description }: { title: string; description: string }) {
  return (
    <PageShell>
      <div className="py-12 max-w-2xl mx-auto">
        <ErrorState className="w-full" title={title} description={description} />
      </div>
    </PageShell>
  );
}
