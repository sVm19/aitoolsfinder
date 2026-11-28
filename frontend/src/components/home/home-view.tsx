"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Layers, Sparkles } from "lucide-react";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { SmoothScrollShell } from "@/components/scroll/smooth-scroll-shell";
import { HeroSignalDiagram } from "@/components/animations/hero-signal-diagram";

const HeroCanvas = dynamic(
  () => import("@/components/animations/hero-canvas").then((m) => m.HeroCanvas),
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

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const railBoundsRef = useRef<HTMLDivElement>(null);
  const railTrackRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);

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

  // Draggable + InertiaPlugin for horizontal category rail
  useGSAP(
    () => {
      const boundsEl = railBoundsRef.current;
      const trackEl = railTrackRef.current;
      if (!boundsEl || !trackEl) return;

      const instances = Draggable.create(trackEl, {
        type: "x",
        bounds: boundsEl,
        inertia: true,
        edgeResistance: 0.75,
        dragClickables: true,
        allowNativeTouchScrolling: true,
      });

      void InertiaPlugin;

      return () => {
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
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: "24",
        category,
        pricing,
      });
      const res = await fetch(`/api/home-tools?${params.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: ToolCardData[];
        total: number;
        page: number;
        totalPages: number;
      };
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    fetchTools({
      nextPage: 1,
      category: slug,
      pricing: activePricing,
      append: false,
    });
  };

  const handlePricingChange = (value: string) => {
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

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || page >= totalPages || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading && page < totalPages) {
          fetchTools({
            nextPage: page + 1,
            category: activeCategory,
            pricing: activePricing,
            append: true,
          });
        }
      },
      { rootMargin: "320px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, totalPages, isLoading, activeCategory, activePricing]);

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
        <main className="flex-1 pt-14">
          {/* Precision Hero */}
          <section
            aria-labelledby="home-title"
            data-enter
            className="relative isolate overflow-hidden"
          >
            <HeroCanvas />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/30 via-background/75 to-background" />

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
            aria-label="Browse filters"
            className="bg-background"
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
                          "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-9 hover:-translate-y-0.5 active:scale-[0.97]",
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
                          "rounded-lg border px-3 py-1 text-xs font-medium transition-all duration-150 min-h-8 hover:-translate-y-0.5 active:scale-[0.97]",
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
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
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

            {page < totalPages && (
              <div ref={loadMoreRef} className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  size="md"
                  disabled={isLoading}
                  onClick={() =>
                    fetchTools({
                      nextPage: page + 1,
                      category: activeCategory,
                      pricing: activePricing,
                      append: true,
                    })
                  }
                >
                  {isLoading
                    ? "Loading more tools..."
                    : `Load more tools (${total - tools.length} remaining)`}
                </Button>
              </div>
            )}
          </section>
        </main>

        <Footer />
      </SmoothScrollShell>
    </div>
  );
}
