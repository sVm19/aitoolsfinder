import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs
            className="mb-8"
            items={[
              { label: "Home", href: "/" },
              { label: comparison.title },
            ]}
          />
          <header className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
              Published comparison
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {comparison.title}
            </h1>
            {comparison.summary && (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {comparison.summary}
              </p>
            )}
          </header>

          <section
            aria-label="Compared tools"
            className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {comparison.tools.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${encodeURIComponent(tool.slug)}`}
                className="group rounded-xl border border-border bg-surface-1 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="block text-base font-semibold text-foreground group-hover:text-primary-content">
                  {tool.name}
                </span>
                {tool.primary_category && (
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {tool.primary_category.name}
                  </span>
                )}
                {tool.tagline && (
                  <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-subtle-foreground">
                    {tool.tagline}
                  </span>
                )}
              </Link>
            ))}
          </section>

          <aside className="mt-6 rounded-xl border border-primary/25 bg-primary/5 px-4 py-4 sm:px-5">
            <p className="text-sm font-semibold text-foreground">No overall winner is published</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Use the sourced feature and pricing details below to decide which tool fits your needs.
              Unknown means the catalog has no confirmed value.
            </p>
          </aside>

          <ComparisonMatrixView comparison={comparison} />
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
