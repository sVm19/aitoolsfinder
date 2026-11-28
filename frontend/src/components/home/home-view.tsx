"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, ChevronLeft, ChevronRight, Layers, Sparkles } from "lucide-react";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { SmoothScrollShell } from "@/components/scroll/smooth-scroll-shell";

const HeroCanvas = dynamic(
  () => import("@/components/animations/hero-canvas").then((m) => m.HeroCanvas),
  { ssr: false }
);

const HeroSignalDiagram = dynamic(
  () =>
    import("@/components/animations/hero-signal-diagram").then(
      (m) => m.HeroSignalDiagram
    ),
  { ssr: false }
);
import { SplitText } from "@/components/bits/split-text";
import { ToolCard, type ToolCardData } from "@/components/tool/tool-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  Draggable,
  Flip,
  InertiaPlugin,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/gsap";

const CATEGORY_PILLS = [
  { slug: "all", label: "All Tools" },
  { slug: "ai", label: "AI" },
  { slug: "developer-tools", label: "Developer Tools" },
  { slug: "marketing", label: "Marketing" },
  { slug: "productivity", label: "Productivity" },
  { slug: "sales", label: "Sales" },
  { slug: "analytics", label: "Analytics" },
  { slug: "design", label: "Design" },
  { slug: "writing", label: "Writing" },
  { slug: "automation", label: "Automation" },
  { slug: "hr", label: "HR" },
  { slug: "security", label: "Security" },
] as const;

const PRICING_PILLS = [
  { value: "all", label: "All Pricing" },
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "Paid" },
] as const;

interface HomeViewProps {
  initialTools: ToolCardData[];
  initialTotal: number;
  initialTotalPages: number;
}

export function HomeView({
  initialTools,
  initialTotal,
  initialTotalPages,
}: HomeViewProps) {
  const [tools, setTools] = useState<ToolCardData[]>(initialTools);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activePricing, setActivePricing] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [quickReviewTools, setQuickReviewTools] = useState<ToolCardData[]>([]);

  const catalogTopRef = useRef<HTMLElement>(null);
  const railBoundsRef = useRef<HTMLDivElement>(null);
  const railTrackRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pageCacheRef = useRef<
    Map<
      string,
      { items: ToolCardData[]; total: number; page: number; totalPages: number }
    >
  >(
    new Map([
      [
        "1|all|all",
        {
          items: initialTools,
          total: initialTotal,
          page: 1,
          totalPages: initialTotalPages,
        },
      ],
    ])
  );

  useEffect(() => {
    try {
      const raw = JSON.parse(
        localStorage.getItem("aitoolsfinder_submitted_tools") || "[]"
      );
      if (!Array.isArray(raw)) return;
      const featured: ToolCardData[] = raw
        .filter(
          (item) =>
            item &&
            item.submission_type === "featured" &&
            item.tool_slug &&
            item.tool_name
        )
        .map((item) => ({
          id: String(item.id || `quick-${item.tool_slug}`),
          name: String(item.tool_name),
          slug: String(item.tool_slug),
          tagline: String(item.tagline || "Newly submitted via Quick Review."),
          category: String(item.category || "AI"),
          categorySlug: String(item.category_slug || "ai"),
          pricingModel:
            (item.pricing_model as ToolCardData["pricingModel"]) || "freemium",
          startingPrice: item.starting_price_minor
            ? `$${Math.round(Number(item.starting_price_minor) / 100)}/mo`
            : undefined,
          websiteUrl: item.website_url ? String(item.website_url) : undefined,
          isVerified: true,
          isSponsored: true,
        }));
      setQuickReviewTools(featured);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Draggable + InertiaPlugin for horizontal category rail (deferred post-layout)
  useGSAP(
    () => {
      const boundsEl = railBoundsRef.current;
      const trackEl = railTrackRef.current;
      if (!boundsEl || !trackEl) return;

      let instances: Draggable[] = [];
      const rafId = requestAnimationFrame(() => {
        instances = Draggable.create(trackEl, {
          type: "x",
          bounds: boundsEl,
          inertia: true,
          edgeResistance: 0.75,
          dragClickables: false,
          minimumMovement: 6,
          allowNativeTouchScrolling: true,
        });
      });

      void InertiaPlugin;

      return () => {
        cancelAnimationFrame(rafId);
        instances.forEach((d) => d.kill());
      };
    },
    { scope: railBoundsRef }
  );

  const captureFlipState = () => {
    if (prefersReducedMotion() || !gridRef.current) return;
    const items = gridRef.current.querySelectorAll(".tool-card-item");
    if (items.length > 0) {
      flipStateRef.current = Flip.getState(items);
    }
  };

  useLayoutEffect(() => {
    const state = flipStateRef.current;
    if (!state || prefersReducedMotion()) {
      flipStateRef.current = null;
      return;
    }
    flipStateRef.current = null;
    Flip.from(state, {
      duration: 0.42,
      ease: "earlyst-out",
      stagger: 0.015,
      simple: true,
      prune: true,
    });
  }, [tools, activeCategory, activePricing]);

  const applyToolsResponse = (
    data: {
      items: ToolCardData[];
      total: number;
      page: number;
      totalPages: number;
    },
    append: boolean
  ) => {
    if (!append) {
      captureFlipState();
    }
    setTools((prev) => {
      if (!append) return data.items;
      const seen = new Set(prev.map((t) => t.slug));
      const fresh = data.items.filter((t) => !seen.has(t.slug));
      return [...prev, ...fresh];
    });
    setTotal(data.total);
    setPage(data.page);
    setTotalPages(data.totalPages);
  };

  const fetchTools = async ({
    nextPage,
    category,
    pricing,
    append,
  }: {
    nextPage: number;
    category: string;
    pricing: string;
    append: boolean;
  }) => {
    const cacheKey = `${nextPage}|${category}|${pricing}`;
    if (!append) {
      const cached = pageCacheRef.current.get(cacheKey);
      if (cached) {
        abortControllerRef.current?.abort();
        setIsLoading(false);
        applyToolsResponse(cached, false);
        return;
      }
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: "24",
        category,
        pricing,
      });
      const res = await fetch(`/api/home-tools?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: ToolCardData[];
        total: number;
        page: number;
        totalPages: number;
      };
      if (!append) {
        pageCacheRef.current.set(cacheKey, data);
      }
      applyToolsResponse(data, append);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const handleCategoryChange = (slug: string) => {
    if (slug === activeCategory) return;
    setActiveCategory(slug);
    fetchTools({
      nextPage: 1,
      category: slug,
      pricing: activePricing,
      append: false,
    });
  };

  const handlePricingChange = (value: string) => {
    if (value === activePricing) return;
    setActivePricing(value);
    fetchTools({
      nextPage: 1,
      category: activeCategory,
      pricing: value,
      append: false,
    });
  };

  const handleResetFilters = () => {
    setActiveCategory("all");
    setActivePricing("all");
    fetchTools({ nextPage: 1, category: "all", pricing: "all", append: false });
  };

  const handlePageChange = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === page || isLoading) {
      return;
    }
    fetchTools({
      nextPage: targetPage,
      category: activeCategory,
      pricing: activePricing,
      append: false,
    });
    if (catalogTopRef.current) {
      const top =
        catalogTopRef.current.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  };

  const getPageNumbers = (): Array<number | "ellipsis"> => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: Array<number | "ellipsis"> = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push("ellipsis");
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  };

  const visibleQuickReview = quickReviewTools.filter((t) => {
    if (activeCategory !== "all" && t.categorySlug !== activeCategory)
      return false;
    if (activePricing !== "all" && t.pricingModel !== activePricing)
      return false;
    return true;
  });
  const quickSlugs = new Set(visibleQuickReview.map((t) => t.slug));
  const displayedTools = [
    ...visibleQuickReview,
    ...tools.filter((t) => !quickSlugs.has(t.slug)),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-white">
      <Navbar />

      <SmoothScrollShell>
        <main
          className="flex-1 pt-14"
          style={{
            background:
              "radial-gradient(960px 520px at 16% 0%, rgba(14, 165, 233, 0.11), transparent 72%), radial-gradient(820px 480px at 86% 6%, rgba(255, 94, 30, 0.08), transparent 70%)",
          }}
        >
          {/* Precision Hero */}
          <section
            aria-labelledby="home-title"
            data-enter
            className="relative isolate overflow-hidden"
          >
            <HeroCanvas />

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:px-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/90 px-3 py-1 text-xs font-medium text-foreground">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                  YC · GitHub · Product Hunt · {total.toLocaleString()} Listed Tools
                </span>
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-1.5 text-xs text-primary-content hover:text-white transition-colors"
                >
                  <span>Built a tool? List it free</span>
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <SplitText
                    id="home-title"
                    as="h1"
                    text="Pick the right AI tool with audited pricing and capability teardowns."
                    accent="AI tool"
                    className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl leading-[1.12]"
                  />
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Compare 1,200+ AI and SaaS products from YC, GitHub, and Product Hunt side by side. Filter by category or pricing tier in one click.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link href="/ai-finder">
                      <Button variant="primary" size="md">
                        <Sparkles aria-hidden="true" className="h-4 w-4" />
                        <span>Match by Task</span>
                      </Button>
                    </Link>
                    <Link href="/categories">
                      <Button variant="outline" size="md">
                        <Layers aria-hidden="true" className="h-4 w-4" />
                        <span>All Categories</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                <HeroSignalDiagram totalTools={total} />
              </div>
            </div>
          </section>

          {/* Draggable + Inertia Browse Filters */}
          <section
            ref={catalogTopRef}
            aria-label="Browse filters"
            className="bg-transparent"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 lg:px-8">
              <div
                ref={railBoundsRef}
                className="relative overflow-hidden py-0.5"
              >
                <div
                  ref={railTrackRef}
                  className="flex w-max items-center gap-2 cursor-grab active:cursor-grabbing"
                >
                  {CATEGORY_PILLS.map((pill) => {
                    const selected = activeCategory === pill.slug;
                    return (
                      <button
                        key={pill.slug}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => handleCategoryChange(pill.slug)}
                        className={cn(
                          "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors duration-150 min-h-[44px] sm:min-h-9 active:scale-[0.97]",
                          selected
                            ? "border-primary bg-primary text-primary-foreground font-semibold shadow-lavender-glow"
                            : "border-border bg-surface-1 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {PRICING_PILLS.map((pill) => {
                    const selected = activePricing === pill.value;
                    return (
                      <button
                        key={pill.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => handlePricingChange(pill.value)}
                        className={cn(
                          "rounded-lg border px-3.5 py-2 sm:py-1 text-xs font-medium transition-colors duration-150 min-h-[44px] sm:min-h-8 active:scale-[0.97]",
                          selected
                            ? "border-accent bg-accent/20 text-accent"
                            : "border-border bg-surface-1/60 text-muted-foreground hover:border-border/80 hover:text-foreground"
                        )}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs font-mono text-muted-foreground" aria-live="polite">
                  Showing {displayedTools.length} of{" "}
                  {total + visibleQuickReview.length} tools
                </p>
              </div>
            </div>
          </section>

          {/* Scrollable Tool Catalog */}
          <section
            aria-label="AI tools and SaaS directory"
            className="mx-auto max-w-7xl px-4 py-8 lg:px-8"
          >
            {displayedTools.length === 0 ? (
              <EmptyState
                title="No tools match those filters"
                description="Try switching back to all categories or all pricing models."
                action={
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleResetFilters}
                  >
                    Reset filters
                  </Button>
                }
              />
            ) : (
              <ul
                ref={gridRef}
                aria-busy={isLoading}
                className={cn(
                  "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-150",
                  isLoading && "opacity-60"
                )}
              >
                {displayedTools.map((tool, index) => (
                  <li
                    key={tool.slug}
                    data-flip-id={tool.slug}
                    className={cn(
                      "tool-card-item transition-transform duration-150 hover:-translate-y-0.5",
                      index >= 6 && "below-fold-card"
                    )}
                  >
                    <ToolCard tool={tool} className="h-full" />
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <nav
                aria-label="Catalog pagination"
                className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => handlePageChange(page - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Prev</span>
                </Button>

                {getPageNumbers().map((item, idx) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-xs text-muted-foreground select-none"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      type="button"
                      variant={item === page ? "primary" : "outline"}
                      size="sm"
                      disabled={isLoading}
                      onClick={() => handlePageChange(item)}
                      aria-label={`Page ${item}`}
                      aria-current={item === page ? "page" : undefined}
                      className="min-w-9 font-mono"
                    >
                      {item}
                    </Button>
                  )
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => handlePageChange(page + 1)}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </section>
        </main>

        <Footer />
      </SmoothScrollShell>
    </div>
  );
}
