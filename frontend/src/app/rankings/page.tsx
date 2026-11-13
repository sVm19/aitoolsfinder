import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { ErrorState } from "@/components/ui/error-state";
import { getActiveCategories, getActiveTags, type CatalogCategory, type CatalogTag } from "@/lib/catalog-api";
import { canonicalUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [categories, tags] = await Promise.all([getActiveCategories(), getActiveTags()]);
    return {
      title: "AI Tool Rankings by Category and Tag",
      description: "Browse AI tool rankings by category or tag, based on the latest published intelligence score snapshots.",
      alternates: { canonical: canonicalUrl("/rankings") },
      robots: { index: categories.length + tags.length > 0, follow: true },
    };
  } catch {
    return {
      title: "AI Tool Rankings by Category and Tag",
      alternates: { canonical: canonicalUrl("/rankings") },
      robots: { index: false, follow: true },
    };
  }
}

export default async function RankingsIndexPage() {
  const [categoriesResult, tagsResult] = await Promise.allSettled([getActiveCategories(), getActiveTags()]);
  if (categoriesResult.status === "rejected" && tagsResult.status === "rejected") {
    return (
      <PageShell>
        <ErrorState
          className="w-full"
          title="Ranking categories are temporarily unavailable"
          description="We couldn't load the active tool categories from the catalog. Try again in a moment."
        />
      </PageShell>
    );
  }
  const categories: CatalogCategory[] = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const tags: CatalogTag[] = tagsResult.status === "fulfilled" ? tagsResult.value : [];

  return (
    <PageShell breadcrumbs={[{ label: "Home", href: "/" }, { label: "Rankings" }]}>
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          Intelligence rankings
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Curated tool rankings
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Rankings use each published tool’s audited benchmark scores, uptime, and pricing transparency.
        </p>
      </header>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-accent" />
          Rankings by category
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/rankings/${encodeURIComponent(category.slug)}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-surface-1/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-all duration-200 hover:border-primary/60 hover:bg-surface-2 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div>
                  <span className="block text-lg font-semibold text-foreground group-hover:text-primary-content transition-colors">
                    {category.name}
                  </span>
                  {category.description && (
                    <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">
                      {category.description}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary-content">
                  <span>View leaderboard</span>
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {tags.length > 0 && (
        <section className="mt-14" aria-labelledby="tag-rankings-title">
          <h2 id="tag-rankings-title" className="text-xl font-semibold tracking-tight text-foreground">
            Browse rankings by tag
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <li key={tag.id}>
                <Link
                  href={`/rankings/${encodeURIComponent(tag.slug)}?taxonomy_type=tag`}
                  className="group flex min-h-14 items-center justify-between gap-4 rounded-xl border border-border bg-surface-1/70 px-4 py-3 transition-colors hover:border-primary/45 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="font-medium text-foreground group-hover:text-primary-content transition-colors">
                    {tag.name}
                  </span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 rounded-2xl border border-primary/20 bg-surface-1/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Transparent Methodology</h3>
          <p className="text-xs text-muted-foreground mt-1">Learn how our editorial and scoring algorithms rank published AI tools.</p>
        </div>
        <Link
          href="/methodology"
          className="inline-flex items-center gap-2 text-xs font-medium text-primary-content hover:underline underline-offset-4"
        >
          Read scoring methodology
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </PageShell>
  );
}
