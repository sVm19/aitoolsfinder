import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/common/page-shell";
import { ErrorState } from "@/components/ui/error-state";
import { ComparisonMatrixView } from "@/components/comparison/comparison-matrix";
import {
  CatalogApiError,
  getComparisonBySlug,
  type ComparisonMatrix,
} from "@/lib/catalog-api";
import { canonicalUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const comparison = await getComparisonBySlug(slug);
    const description =
      comparison.summary ??
      `Compare published features and pricing for ${comparison.tools.map((tool) => tool.name).join(" and ")}.`;
    const url = canonicalUrl(`/compare/${encodeURIComponent(slug)}`);
    return {
      title: `${comparison.title} comparison`,
      description,
      alternates: { canonical: url },
      robots: { index: comparison.tools.length >= 2, follow: true },
      openGraph: {
        title: `${comparison.title} | AIToolsFinder`,
        description,
        url,
        type: "website",
      },
    };
  } catch {
    return {
      title: "AI Tool Comparison",
      alternates: { canonical: canonicalUrl(`/compare/${encodeURIComponent(slug)}`) },
      robots: { index: false, follow: true },
    };
  }
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let comparison: ComparisonMatrix;
  try {
    comparison = await getComparisonBySlug(slug);
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) notFound();
    return (
      <PublicErrorPage
        title="Comparison details are temporarily unavailable"
        description="We couldn't load the published comparison from the catalog. Try again in a moment."
      />
    );
  }

  return (
    <PageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Compare", href: "/compare" },
        { label: comparison.title },
      ]}
    >
      <header className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          Published comparison
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {comparison.title}
        </h1>
        {comparison.summary && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {comparison.summary}
          </p>
        )}
      </header>

      <section
        aria-label="Compared tools"
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {comparison.tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${encodeURIComponent(tool.slug)}`}
            className="group rounded-2xl border border-white/10 bg-surface-1/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="block text-lg font-semibold text-foreground group-hover:text-primary-content transition-colors">
              {tool.name}
            </span>
            {tool.primary_category && (
              <span className="mt-1 block text-xs font-medium text-primary-content">
                {tool.primary_category.name}
              </span>
            )}
            {tool.tagline && (
              <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">
                {tool.tagline}
              </span>
            )}
          </Link>
        ))}
      </section>

      <aside className="mt-8 rounded-2xl border border-primary/25 bg-surface-1/60 p-5 backdrop-blur-md">
        <p className="text-sm font-semibold text-foreground">Evidence-based comparison</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Use the verified feature and pricing matrix below to decide which tool fits your workflow.
          Scores reflect latest benchmark snapshots.
        </p>
      </aside>

      <div className="mt-8">
        <ComparisonMatrixView comparison={comparison} />
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
