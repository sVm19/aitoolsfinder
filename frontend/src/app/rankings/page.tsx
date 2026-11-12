import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
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
    <PageShell>
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">Intelligence rankings</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Explore rankings</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Rankings use each published tool’s latest stored score snapshot. Categories without scored tools show an empty state.
        </p>
      </header>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <li key={category.id}>
            <Link href={`/rankings/${encodeURIComponent(category.slug)}`} className="group flex h-full items-center justify-between gap-4 rounded-xl border border-border bg-surface-1 p-4 transition-colors hover:border-primary/45 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span>
                <span className="block font-semibold text-foreground group-hover:text-primary-content">{category.name}</span>
                {category.description && <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">{category.description}</span>}
              </span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
      {tags.length > 0 && (
        <section className="mt-12" aria-labelledby="tag-rankings-title">
          <h2 id="tag-rankings-title" className="text-2xl font-semibold tracking-tight text-foreground">Browse by tag</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <li key={tag.id}>
                <Link href={`/rankings/${encodeURIComponent(tag.slug)}?taxonomy_type=tag`} className="group flex min-h-14 items-center justify-between gap-4 rounded-xl border border-border bg-surface-1 p-4 transition-colors hover:border-primary/45 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <span className="font-semibold text-foreground group-hover:text-primary-content">{tag.name}</span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/methodology" className="text-primary-content underline underline-offset-4 hover:text-foreground">Read how scores are calculated</Link>
      </p>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
