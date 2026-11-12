"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  GitCompare,
  Loader2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { useCompare } from "@/components/comparison/compare-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CatalogApiError,
  getAIRecommendations,
  submitRecommendationFeedback,
  type AIRecommendation,
  type AIRecommendationPricing,
  type AIRecommendationResponse,
  type CatalogCategory,
} from "@/lib/catalog-api";

const EXAMPLES = [
  "Best AI tool for podcast transcripts",
  "AI coder under $20/mo",
  "Free AI writing assistant for long-form blogs",
];

const PRICING_OPTIONS = [
  { value: "", label: "Any budget" },
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "Paid" },
  { value: "usage_based", label: "Usage based" },
];

type SearchStatus = "idle" | "loading" | "success" | "error";
type FeedbackState = "idle" | "sending" | "sent" | "error";

interface AIFinderViewProps {
  categories: CatalogCategory[];
}

function formatPrice(plan: AIRecommendationPricing): string {
  if (plan.is_free) return "Free";
  if (plan.amount_minor === null) return "Contact sales";

  const currency = plan.currency ?? "USD";
  let amount: string;
  try {
    amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(plan.amount_minor / 100);
  } catch {
    amount = `${(plan.amount_minor / 100).toFixed(2)} ${currency}`;
  }

  if (!plan.billing_interval || plan.billing_interval === "unknown") {
    return amount;
  }
  return `${amount} / ${plan.billing_interval.replace("_", " ")}`;
}

export function AIFinderView({ categories }: AIFinderViewProps) {
  const [query, setQuery] = useState("");
  const [pricing, setPricing] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [result, setResult] = useState<AIRecommendationResponse | null>(null);
  const [error, setError] = useState<{ title: string; description: string } | null>(
    null,
  );
  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({});
  const { tools: compareTools, addTool, removeTool, isFull } = useCompare();

  async function runSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || status === "loading") return;

    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const response = await getAIRecommendations({
        query: trimmed,
        pricing_model: pricing || undefined,
        category_slugs: category ? [category] : undefined,
      });
      setResult(response);
      setStatus("success");
    } catch (caught) {
      if (caught instanceof CatalogApiError && caught.status === 429) {
        setError({
          title: "Too many searches",
          description:
            "You have reached the AI Finder limit for this minute. Wait a moment and try again.",
        });
      } else if (caught instanceof CatalogApiError && caught.status === 422) {
        setError({
          title: "Check your request",
          description: caught.message || "The search request was not valid.",
        });
      } else {
        setError({
          title: "AI Finder is temporarily unavailable",
          description:
            "We could not reach the recommendation service. Try again in a moment.",
        });
      }
      setStatus("error");
    }
  }

  function resetSearch() {
    setQuery("");
    setPricing("");
    setCategory("");
    setResult(null);
    setError(null);
    setStatus("idle");
  }

  async function sendFeedback(tool: AIRecommendation, rating: number) {
    setFeedback((current) => ({ ...current, [tool.tool_id]: "sending" }));
    try {
      await submitRecommendationFeedback({
        tool_id: tool.tool_id,
        query: query.trim() || undefined,
        rating,
      });
      setFeedback((current) => ({ ...current, [tool.tool_id]: "sent" }));
    } catch {
      setFeedback((current) => ({ ...current, [tool.tool_id]: "error" }));
    }
  }

  function toggleCompare(tool: AIRecommendation) {
    if (compareTools.some((item) => item.slug === tool.slug)) {
      removeTool(tool.slug);
      return;
    }
    addTool({ id: tool.tool_id, name: tool.name, slug: tool.slug });
  }

  const topTwo = result?.items.slice(0, 2) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "AI Finder" }]}
            className="mb-8"
          />

          <header className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
              Catalog-grounded recommendations
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Describe the job. Get matched tools.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              We search the published catalog first, then explain the fit. No invented
              tools, features, or prices.
            </p>
          </header>

          <form
            onSubmit={runSearch}
            className="mx-auto mt-8 max-w-3xl rounded-2xl border border-border bg-surface-1 p-4 sm:p-6"
          >
            <label htmlFor="ai-finder-query" className="sr-only">
              Describe what you need
            </label>
            <textarea
              id="ai-finder-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="e.g. A free AI writing assistant for long-form blog posts"
              className="w-full resize-none rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {PRICING_OPTIONS.map((option) => {
                  const active = pricing === option.value;
                  return (
                    <button
                      key={option.value || "any"}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPricing(option.value)}
                      className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        active
                          ? "border-primary/60 bg-primary/15 text-primary-content"
                          : "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                {categories.length > 0 && (
                  <Select
                    aria-label="Filter by category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="min-w-40"
                  >
                    <option value="">All categories</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                )}
                <Button
                  type="submit"
                  className="shrink-0"
                  disabled={!query.trim() || status === "loading"}
                >
                  {status === "loading" ? (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles aria-hidden="true" className="h-4 w-4" />
                  )}
                  {status === "loading" ? "Matching…" : "Find tools"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="rounded-full border border-border/70 bg-surface-1 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {example}
              </button>
            ))}
          </div>

          <section
            aria-live="polite"
            aria-busy={status === "loading"}
            className="mx-auto mt-10 max-w-4xl"
          >
            {status === "idle" && (
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "Catalog first",
                    body: "Only published tools from the verified catalog become candidates.",
                  },
                  {
                    title: "Grounded reasoning",
                    body: "Match reasons and tradeoffs are checked against catalog fields.",
                  },
                  {
                    title: "Authoritative pricing",
                    body: "Prices come from catalog records, never from the model.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-border bg-surface-1 p-5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary-content">
                      <Check aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <h2 className="mt-3 text-sm font-semibold text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {status === "loading" && (
              <div className="space-y-4" aria-label="Loading recommendations">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-xl border border-border bg-surface-1 p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            )}

            {status === "error" && error && (
              <ErrorState
                title={error.title}
                description={error.description}
                action={
                  <Button variant="outline" onClick={() => runSearch()}>
                    Try again
                  </Button>
                }
              />
            )}

            {status === "success" && result && (
              <div>
                {result.notice && (
                  <div
                    role="status"
                    className="mb-5 flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent"
                  >
                    <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{result.notice}</p>
                  </div>
                )}

                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Matches for “{query.trim()}”
                    </h2>
                    <p role="status" className="mt-1 text-sm text-muted-foreground">
                      {result.items.length}{" "}
                      {result.items.length === 1 ? "tool" : "tools"} ·{" "}
                      {result.prompt_version} · {result.latency_ms} ms
                    </p>
                  </div>
                  {topTwo.length === 2 && (
                    <Link
                      href={`/compare/preview?tool=${encodeURIComponent(
                        topTwo[0].slug,
                      )}&tool=${encodeURIComponent(topTwo[1].slug)}`}
                      prefetch={false}
                    >
                      <Button variant="outline" size="sm">
                        <GitCompare aria-hidden="true" className="h-4 w-4" />
                        Compare top two
                      </Button>
                    </Link>
                  )}
                </div>

                {result.items.length === 0 ? (
                  <EmptyState
                    title="No published tools match that request"
                    description="Try a broader description, remove the pricing or category filter, or browse the full catalog."
                    action={
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button variant="outline" onClick={resetSearch}>
                          Start over
                        </Button>
                        <Link href="/explore">
                          <Button variant="secondary">
                            Browse catalog
                            <ArrowRight aria-hidden="true" className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    }
                  />
                ) : (
                  <ol className="space-y-4">
                    {result.items.map((tool) => {
                      const selected = compareTools.some(
                        (item) => item.slug === tool.slug,
                      );
                      const feedbackState = feedback[tool.tool_id] ?? "idle";
                      return (
                        <li
                          key={tool.tool_id}
                          className="rounded-xl border border-border bg-surface-1 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/tools/${tool.slug}`}
                                  className="text-lg font-semibold text-foreground hover:text-primary-content"
                                >
                                  {tool.name}
                                </Link>
                                {tool.is_verified && (
                                  <Badge variant="verified">Verified</Badge>
                                )}
                              </div>
                              {tool.tagline && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {tool.tagline}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-semibold tabular-nums text-foreground">
                                {Math.round(tool.match_score)}
                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                  / 100 match
                                </span>
                              </p>
                              <div className="mt-1.5 h-1.5 w-24 rounded-full bg-surface-3">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${Math.min(tool.match_score, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {tool.match_reasons.length > 0 && (
                            <ul className="mt-4 space-y-1.5">
                              {tool.match_reasons.map((reason) => (
                                <li
                                  key={reason}
                                  className="flex items-start gap-2 text-sm text-foreground"
                                >
                                  <Check
                                    aria-hidden="true"
                                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                                  />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {tool.tradeoffs.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {tool.tradeoffs.map((tradeoff) => (
                                <li
                                  key={tradeoff}
                                  className="flex items-start gap-2 text-sm text-accent"
                                >
                                  <AlertTriangle
                                    aria-hidden="true"
                                    className="mt-0.5 h-4 w-4 shrink-0"
                                  />
                                  <span>{tradeoff}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {tool.relevant_feature_slugs.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {tool.relevant_feature_slugs.map((slug) => (
                                <Badge key={slug} variant="secondary">
                                  {slug.replace(/-/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 rounded-lg border border-border/70 bg-surface-2/60 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Catalog pricing
                            </p>
                            {tool.pricing.length > 0 ? (
                              <ul className="mt-2 space-y-1">
                                {tool.pricing.slice(0, 3).map((plan) => (
                                  <li
                                    key={plan.name}
                                    className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                                  >
                                    <span className="text-muted-foreground">
                                      {plan.name}
                                    </span>
                                    <span className="font-medium text-foreground">
                                      {formatPrice(plan)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-sm text-subtle-foreground">
                                Pricing is not recorded in the catalog yet.
                              </p>
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {feedbackState === "sent" ? (
                                <span className="text-emerald-400">
                                  Thanks — feedback recorded.
                                </span>
                              ) : (
                                <>
                                  <span>
                                    {feedbackState === "error"
                                      ? "Feedback failed. Try again."
                                      : "Did this fit?"}
                                  </span>
                                  <button
                                    type="button"
                                    aria-label={`Mark ${tool.name} as a good match`}
                                    onClick={() => sendFeedback(tool, 5)}
                                    disabled={feedbackState === "sending"}
                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                                  >
                                    <ThumbsUp aria-hidden="true" className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Mark ${tool.name} as a poor match`}
                                    onClick={() => sendFeedback(tool, 2)}
                                    disabled={feedbackState === "sending"}
                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                                  >
                                    <ThumbsDown aria-hidden="true" className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant={selected ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => toggleCompare(tool)}
                                disabled={!selected && isFull}
                              >
                                <GitCompare aria-hidden="true" className="h-4 w-4" />
                                {selected ? "In compare" : "Compare"}
                              </Button>
                              <Link href={`/tools/${tool.slug}`}>
                                <Button size="sm">
                                  View tool
                                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}

                <p className="mt-5 text-xs leading-relaxed text-subtle-foreground">
                  Match scores are relative ranks within this result set, not measured
                  product benchmarks. Prices and features come from catalog records.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
