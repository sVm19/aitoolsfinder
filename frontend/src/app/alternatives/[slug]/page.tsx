import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, GitCompare, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { ComparisonMatrixView } from "@/components/comparison/comparison-matrix";
import { ErrorState } from "@/components/ui/error-state";
import {
  CatalogApiError,
  getAlternativesBySlug,
  previewComparison,
  type AlternativesResponse,
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
    const data = await getAlternativesBySlug(slug);
    const title = `Alternatives to ${data.tool.name}`;
    const description =
      data.tool.tagline ??
      `Review ${data.alternatives.length} published alternatives to ${data.tool.name}, with sourced details and catalog overlap.`;
    const url = canonicalUrl(`/alternatives/${encodeURIComponent(slug)}`);
    return {
      title,
      description,
      alternates: { canonical: url },
      robots: { index: data.alternatives.length > 0, follow: true },
      openGraph: { title: `${title} | AIToolsFinder`, description, url, type: "website" },
    };
  } catch {
    return {
      title: "AI Tool Alternatives",
      alternates: { canonical: canonicalUrl(`/alternatives/${encodeURIComponent(slug)}`) },
      robots: { index: false, follow: true },
    };
  }
}

export default async function AlternativesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let data: AlternativesResponse;
  try {
    data = await getAlternativesBySlug(slug);
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) notFound();
    return (
      <PublicErrorPage
        title="Alternatives are temporarily unavailable"
        description="We couldn't load this tool and its published alternatives from the catalog. Try again in a moment."
      />
    );
  }

  let quickComparison: ComparisonMatrix | null = null;
  if (data.alternatives.length > 0) {
    const comparedTools = [data.tool, ...data.alternatives.slice(0, 3).map((item) => item.tool)];
    try {
      quickComparison = await previewComparison(comparedTools.map((tool) => tool.slug));
    } catch {
      quickComparison = null;
    }
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
              { label: `Alternatives to ${data.tool.name}` },
            ]}
          />

          <header className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
              Tool alternatives
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Alternatives to {data.tool.name}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {data.tool.tagline ?? `Compare published alternatives to ${data.tool.name} using catalog details.`}
            </p>
          </header>

          <section aria-labelledby="original-tool-title" className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-content">Starting point</p>
                <h2 id="original-tool-title" className="mt-2 text-xl font-semibold text-foreground">{data.tool.name}</h2>
                {data.tool.primary_category && <p className="mt-1 text-sm text-muted-foreground">{data.tool.primary_category.name}</p>}
              </div>
              <Link href={`/tools/${encodeURIComponent(data.tool.slug)}`} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                View tool profile <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section aria-labelledby="alternatives-list-title" className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">Published alternatives</p>
                <h2 id="alternatives-list-title" className="mt-2 text-xl font-semibold text-foreground">Options to consider</h2>
              </div>
              <span className="text-sm text-muted-foreground">{data.alternatives.length} listed</span>
            </div>

            {data.alternatives.length ? (
              <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.alternatives.map((alternative) => (
                  <li key={alternative.tool.id} className="flex flex-col rounded-xl border border-border bg-surface-1 p-5 transition-colors hover:border-primary/45 hover:bg-surface-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/tools/${encodeURIComponent(alternative.tool.slug)}`} className="rounded-sm text-lg font-semibold text-foreground underline decoration-primary/50 underline-offset-4 hover:text-primary-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          {alternative.tool.name}
                        </Link>
                        {alternative.tool.primary_category && <p className="mt-1 text-xs text-muted-foreground">{alternative.tool.primary_category.name}</p>}
                      </div>
                      {alternative.source === "curated" ? (
                        <span className="shrink-0 rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">Curated</span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                          <Sparkles aria-hidden="true" className="h-3 w-3" /> Catalog match
                        </span>
                      )}
                    </div>
                    {alternative.tool.tagline && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{alternative.tool.tagline}</p>}
                    <div className="mt-4 border-t border-border/70 pt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle-foreground">Why switch?</p>
                      <p className="mt-2 inline-flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed text-foreground">
                        <span aria-hidden="true" className="mt-0.5 text-primary-content">•</span>
                        <span>{alternative.rationale ?? "This tool is listed as an alternative in the catalog."}</span>
                      </p>
                    </div>
                    {alternative.source === "related" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {alternative.shared_categories > 0 && <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{alternative.shared_categories} shared categories</span>}
                        {alternative.shared_tags > 0 && <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{alternative.shared_tags} shared tags</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 rounded-xl border border-border bg-surface-1 px-5 py-8 text-sm text-muted-foreground">
                No published alternatives are available for {data.tool.name} yet.
              </div>
            )}
          </section>

          {data.alternatives.length > 0 && (
            <section aria-labelledby="alternative-comparison-title" className="mt-12">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-content">
                  <GitCompare aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="alternative-comparison-title" className="text-xl font-semibold text-foreground">Compare the leading options</h2>
                  <p className="mt-1 text-sm text-muted-foreground">A short side-by-side view of {data.tool.name} and up to three alternatives.</p>
                </div>
              </div>
              {quickComparison ? (
                <ComparisonMatrixView comparison={quickComparison} compact />
              ) : (
                <ErrorState
                  title="Quick comparison is temporarily unavailable"
                  description="The alternatives are listed above, but we couldn't load their feature and pricing matrix right now."
                />
              )}
            </section>
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
