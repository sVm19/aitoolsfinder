import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { ErrorState } from "@/components/ui/error-state";
import {
  CatalogApiError,
  getCategoryRankings,
  type RankingItem,
  type RankingResponse,
} from "@/lib/catalog-api";
import { canonicalUrl } from "@/lib/site";

type SearchParams = Record<string, string | string[] | undefined>;
type PricingFilter = "all" | "free" | "paid";
type TaxonomyType = "category" | "tag";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getPricingFilter(value: string | string[] | undefined): PricingFilter {
  const candidate = first(value);
  return candidate === "free" || candidate === "paid" ? candidate : "all";
}

function getTaxonomyType(value: string | string[] | undefined): TaxonomyType {
  return first(value) === "tag" ? "tag" : "category";
}

function getPage(value: string | string[] | undefined): number {
  const candidate = Number(first(value) ?? "1");
  return Number.isSafeInteger(candidate) && candidate > 0 ? candidate : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const pricingFilter = getPricingFilter(rawSearch.pricing);
  const taxonomyType = getTaxonomyType(rawSearch.taxonomy_type);
  const page = getPage(rawSearch.page);
  const url = canonicalUrl(
    `/rankings/${encodeURIComponent(slug)}${taxonomyType === "tag" ? "?taxonomy_type=tag" : ""}`,
  );
  try {
    const result = await getCategoryRankings(slug, pricingFilter, page, 1, taxonomyType);
    const title = taxonomyType === "tag"
      ? `AI tools tagged ${result.taxonomy_name}`
      : `Best ${result.taxonomy_name} AI tools`;
    const description =
      result.taxonomy_description ??
      `Compare published ${result.taxonomy_name} AI tools using the latest available intelligence scores.`;
    return {
      title,
      description,
      alternates: { canonical: url },
      robots: { index: pricingFilter === "all" && page === 1 && result.total > 0, follow: true },
      openGraph: { title: `${title} | AIToolsFinder`, description, url, type: "website" },
    };
  } catch {
    return {
      title: "AI Tool Rankings",
      alternates: { canonical: url },
      robots: { index: false, follow: true },
    };
  }
}

export default async function RankingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const pricingFilter = getPricingFilter(rawSearch.pricing);
  const taxonomyType = getTaxonomyType(rawSearch.taxonomy_type);
  const page = getPage(rawSearch.page);
  let result: RankingResponse;

  try {
    result = await getCategoryRankings(slug, pricingFilter, page, 25, taxonomyType);
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) notFound();
    return (
      <PublicErrorPage
        title="Rankings are temporarily unavailable"
        description="We couldn't load published rankings from the catalog. Try again in a moment."
      />
    );
  }

  const organicItems = result.items.filter((item) => !item.tool.is_sponsored);
  const sponsoredItems = result.items.filter((item) => item.tool.is_sponsored);
  const title = taxonomyType === "tag"
    ? `AI tools tagged ${result.taxonomy_name}`
    : `Best ${result.taxonomy_name} AI tools`;
  const description = result.taxonomy_description;

  return (
    <PageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Rankings", href: "/rankings" },
        { label: result.taxonomy_name },
      ]}
    >
      <header className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          Category rankings
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>}
      </header>

          <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-1 p-4">
            <Info aria-hidden="true" className="h-4 w-4 text-primary-content" />
            <p className="text-sm text-muted-foreground">
              Organic ranks use the latest published score snapshot. Sponsored placements appear separately and do not change scores or organic positions.
            </p>
          </div>

          <form action={`/rankings/${encodeURIComponent(slug)}`} method="get" className="mt-7 flex flex-wrap items-end gap-3">
            {taxonomyType === "tag" && <input type="hidden" name="taxonomy_type" value="tag" />}
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              Pricing
              <select name="pricing" defaultValue={pricingFilter} className="min-h-11 min-w-48 rounded-lg border border-border bg-surface-1 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="all">All pricing models</option>
                <option value="free">Free and freemium</option>
                <option value="paid">Paid plans</option>
              </select>
            </label>
            <button type="submit" className="inline-flex min-h-11 items-center rounded-lg border border-primary/50 bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Apply filter
            </button>
          </form>

          {result.total === 0 ? (
            <section className="mt-8 rounded-xl border border-border bg-surface-1 px-5 py-9">
              <h2 className="text-lg font-semibold text-foreground">No published scores yet</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Rankings appear after matching published tools have score history snapshots. No tools are ranked from missing data.
              </p>
              <Link href="/methodology" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-primary-content hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Read the scoring methodology <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </section>
          ) : (
            <>
              <section aria-labelledby="organic-rankings-title" className="mt-9">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">Score-ranked</p>
                    <h2 id="organic-rankings-title" className="mt-2 text-xl font-semibold text-foreground">Organic leaderboard</h2>
                  </div>
                  <span className="text-sm text-muted-foreground">{result.total} scored tools</span>
                </div>
                {organicItems.length ? (
                  <ol className="space-y-3">
                    {organicItems.map((item) => <RankingCard key={item.tool.id} item={item} />)}
                  </ol>
                ) : (
                  <p className="rounded-xl border border-border bg-surface-1 px-5 py-6 text-sm text-muted-foreground">
                    No organic scores are available for this filter.
                  </p>
                )}
              </section>

              {sponsoredItems.length > 0 && (
                <section aria-labelledby="sponsored-rankings-title" className="mt-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Paid placement</p>
                  <h2 id="sponsored-rankings-title" className="mt-2 text-xl font-semibold text-foreground">Sponsored placements</h2>
                  <ul className="mt-4 space-y-3">
                    {sponsoredItems.map((item) => <RankingCard key={item.tool.id} item={item} sponsored />)}
                  </ul>
                </section>
              )}

              {result.total_pages > 1 && (
                <nav aria-label="Ranking pages" className="mt-8 flex items-center justify-between border-t border-border/70 pt-5">
                  {page > 1 ? (
                    <Link href={rankingPageHref(slug, pricingFilter, page - 1, taxonomyType)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm text-foreground hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Previous
                    </Link>
                  ) : <span />}
                  <span className="text-sm text-muted-foreground">Page {result.page} of {result.total_pages}</span>
                  {page < result.total_pages ? (
                    <Link href={rankingPageHref(slug, pricingFilter, page + 1, taxonomyType)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm text-foreground hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      Next <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  ) : <span />}
                </nav>
              )}
            </>
          )}
    </PageShell>
  );
}

function RankingCard({ item, sponsored = false }: { item: RankingItem; sponsored?: boolean }) {
  return (
    <li className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {!sponsored && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-lg font-bold text-primary-content">
              #{item.rank}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/tools/${encodeURIComponent(item.tool.slug)}`} className="rounded-sm text-lg font-semibold text-foreground underline decoration-primary/50 underline-offset-4 hover:text-primary-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {item.tool.name}
              </Link>
              {sponsored ? (
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">Sponsored placement</span>
              ) : item.rank === 1 ? (
                <span className="rounded-full border border-primary/35 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary-content">Organic #1</span>
              ) : null}
              {item.tool.primary_category && <span className="text-xs text-muted-foreground">{item.tool.primary_category.name}</span>}
            </div>
            {item.tool.tagline && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{item.tool.tagline}</p>}
          </div>
        </div>

        <div className="md:min-w-64 md:text-right">
          <div className="text-2xl font-semibold tabular-nums text-foreground">{item.overall_score.toFixed(2)}<span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span></div>
          <p className="mt-1 text-xs text-muted-foreground">Score {item.score_version} · updated {new Date(item.calculated_at).toLocaleDateString("en", { timeZone: "UTC" })}</p>
          <details className="mt-3 text-left md:text-right">
            <summary className="inline-flex min-h-9 cursor-pointer items-center rounded-md px-2 text-sm font-medium text-primary-content underline decoration-primary/50 underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Score breakdown
            </summary>
            <div className="mt-2 rounded-lg border border-border bg-surface-2 p-3 text-left">
              <ul className="space-y-2">
                {Object.entries(item.dimension_scores).map(([key, score]) => (
                  <li key={key} className="flex items-center justify-between gap-6 text-sm">
                    <span className="text-muted-foreground">{dimensionLabel(key)}</span>
                    <span className="font-medium tabular-nums text-foreground">{score === null ? "Not scored" : `${score.toFixed(2)} / 100`}</span>
                  </li>
                ))}
              </ul>
              <Link href="/methodology" className="mt-3 inline-flex min-h-9 items-center rounded-md text-sm font-medium text-primary-content underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Methodology · {item.score_version}
              </Link>
            </div>
          </details>
        </div>
      </div>
    </li>
  );
}

function dimensionLabel(value: string): string {
  const labels: Record<string, string> = {
    feature_breadth: "Feature breadth",
    pricing_transparency: "Pricing transparency",
    verification_freshness: "Verification and freshness",
    community_documentation: "Community and documentation",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function rankingPageHref(
  slug: string,
  pricing: PricingFilter,
  page: number,
  taxonomyType: TaxonomyType,
): string {
  const params = new URLSearchParams({ pricing, page: String(page) });
  if (taxonomyType === "tag") params.set("taxonomy_type", "tag");
  return `/rankings/${encodeURIComponent(slug)}?${params.toString()}`;
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
