"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { ToolCard } from "@/components/tool/tool-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { CatalogCategory, CatalogTool, PaginatedResponse } from "@/lib/catalog-api";
import { toToolCardData } from "@/lib/catalog-presentation";

export interface ExploreFilters {
  q: string;
  categories: string[];
  pricing: string;
  verified: boolean;
  sort: string;
}

interface ExploreViewProps {
  initialFilters: ExploreFilters;
  page: number;
  results: PaginatedResponse<CatalogTool>;
  categories: CatalogCategory[];
  loadError: boolean;
}

const pricingOptions = [
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "Paid" },
  { value: "usage_based", label: "Usage based" },
  { value: "contact_sales", label: "Contact sales" },
  { value: "unknown", label: "Unknown" },
];

function filtersToQuery(filters: ExploreFilters): string {
  const params = new URLSearchParams();
  const q = filters.q.trim();
  if (q) params.set("q", q);
  for (const category of [...filters.categories].sort()) {
    params.append("category", category);
  }
  if (filters.pricing) params.set("pricing_model", filters.pricing);
  if (filters.verified) params.set("is_verified", "true");
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  return params.toString();
}

function buildExploreUrl(filters: ExploreFilters, page?: number): string {
  const params = new URLSearchParams(filtersToQuery(filters));
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/explore?${query}` : "/explore";
}

export function ExploreView({
  initialFilters,
  page,
  results,
  categories,
  loadError,
}: ExploreViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState(initialFilters);
  const initialKey = filtersToQuery(initialFilters);
  const filtersKey = filtersToQuery(filters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, initialKey]);

  useEffect(() => {
    if (filtersKey === initialKey) return;
    const timeout = window.setTimeout(() => {
      startTransition(() => router.replace(buildExploreUrl(filters), { scroll: false }));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [filters, filtersKey, initialKey, router]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => router.replace(buildExploreUrl(filters), { scroll: false }));
  }

  function toggleCategory(slug: string, checked: boolean) {
    setFilters((current) => ({
      ...current,
      categories: checked
        ? [...new Set([...current.categories, slug])]
        : current.categories.filter((category) => category !== slug),
    }));
  }

  function clearFilters() {
    const emptyFilters: ExploreFilters = {
      q: "",
      categories: [],
      pricing: "",
      verified: false,
      sort: "newest",
    };
    setFilters(emptyFilters);
    startTransition(() => router.replace("/explore", { scroll: false }));
  }

  function goToPage(nextPage: number) {
    startTransition(() =>
      router.push(buildExploreUrl(filters, nextPage), { scroll: false }),
    );
  }

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const activeFilterCount =
    Number(Boolean(filters.q.trim())) +
    filters.categories.length +
    Number(Boolean(filters.pricing)) +
    Number(filters.verified);

  return (
    <PageShell breadcrumbs={[{ label: "Home", href: "/" }, { label: "Explore" }]}>
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          Published catalog
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Explore AI tools
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Search published products and narrow the list by category, pricing, or verification.
        </p>
        <form role="search" onSubmit={submitSearch} className="mt-6 flex flex-col sm:flex-row gap-2">
          <label htmlFor="tool-search" className="sr-only">Search published tools</label>
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
            <Input
              id="tool-search"
              type="search"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              placeholder="Search by tool, feature, or task"
              className="pl-10 h-11"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="md" className="flex-1 sm:flex-initial sm:px-6">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden flex items-center gap-1.5"
              aria-label="Toggle search filters"
            >
              <SlidersHorizontal className="h-4 w-4 text-primary-content" />
              <span>Filters</span>
              {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>}
              {mobileFiltersOpen ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
            </Button>
          </div>
        </form>
      </header>

      <div className="mt-9 grid items-start gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside
          aria-label="Search filters"
          className={`rounded-2xl border border-white/10 bg-surface-1/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md ${
            mobileFiltersOpen ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-primary-content" />
              Filters
              {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}
            </h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-foreground">Categories</legend>
              {categories.length ? (
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {categories.map((category) => (
                    <label key={category.id} className="flex min-h-9 cursor-pointer items-center gap-3 rounded-md px-2 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                      <Checkbox
                        checked={filters.categories.includes(category.slug)}
                        onChange={(event) => toggleCategory(category.slug, event.target.checked)}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-subtle-foreground">Categories are temporarily unavailable.</p>
              )}
            </fieldset>

            <fieldset className="mt-6 border-t border-border/70 pt-5">
              <legend className="text-sm font-medium text-foreground">Pricing</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={!filters.pricing}
                  onClick={() => setFilters((current) => ({ ...current, pricing: "" }))}
                  className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${!filters.pricing ? "border-primary/60 bg-primary/15 text-primary-content" : "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}
                >
                  Any
                </button>
                {pricingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={filters.pricing === option.value}
                    onClick={() => setFilters((current) => ({ ...current, pricing: current.pricing === option.value ? "" : option.value }))}
                    className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${filters.pricing === option.value ? "border-primary/60 bg-primary/15 text-primary-content" : "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 border-t border-border/70 pt-5">
              <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                <Checkbox
                  checked={filters.verified}
                  onChange={(event) => setFilters((current) => ({ ...current, verified: event.target.checked }))}
                />
                Verified tools only
              </label>
            </div>
          </aside>

          <section aria-labelledby="results-title" aria-busy={isPending}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="results-title" className="text-xl font-semibold text-foreground">Search results</h2>
                <p role="status" aria-live="polite" className="mt-1 text-sm text-muted-foreground">
                  {isPending ? "Updating results…" : `${results.total} ${results.total === 1 ? "tool" : "tools"} found`}
                </p>
              </div>
              <label className="flex w-full items-center justify-between gap-3 whitespace-nowrap text-sm text-muted-foreground sm:w-auto sm:justify-normal">
                Sort by
                <Select
                  value={filters.sort}
                  onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}
                  className="min-w-40"
                  aria-label="Sort search results"
                >
                  <option value="newest">Newest</option>
                  <option value="alphabetical">Alphabetical</option>
                  {filters.q && <option value="relevance">Relevance</option>}
                </Select>
              </label>
            </div>

            {loadError ? (
              <ErrorState
                title="Search is temporarily unavailable"
                description="We couldn't load the published catalog. Try again in a moment."
                action={<Button variant="outline" onClick={() => router.refresh()}>Try again</Button>}
              />
            ) : isPending ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading search results">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="space-y-4 rounded-xl border border-border bg-surface-1 p-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-11 w-11" />
                      <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : results.items.length ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {results.items.map((tool) => (
                    <ToolCard key={tool.id} tool={toToolCardData(tool, categories)} />
                  ))}
                </div>
                <nav aria-label="Search result pages" className="mt-8 flex items-center justify-between border-t border-border/70 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page <= 1 || isPending}
                    onClick={() => goToPage(page - 1)}
                  >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {results.page} of {results.total_pages}</span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page >= results.total_pages || isPending}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </nav>
              </>
            ) : (
              <EmptyState
                title={activeFilterCount ? "No tools match these filters" : "No published tools yet"}
                description="Try another search or clear some filters to see more published tools."
                action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
              />
            )}
          </section>
        </div>
    </PageShell>
  );
}
