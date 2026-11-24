"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, ChevronDown, ChevronUp, Sparkles, Layers } from "lucide-react";
import { CategoryCard } from "@/components/tool/category-card";
import { ALL_CATEGORIES, CATEGORY_GROUPS, type CategoryItem } from "./category-data";

interface CategoryExplorerProps {
  initialExpanded?: boolean;
  featuredLimit?: number;
  showHeading?: boolean;
}

export function CategoryExplorer({
  initialExpanded = false,
  featuredLimit = 6,
}: CategoryExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  // If user is searching or has picked a specific group, always expand to full view
  const isFiltering = searchQuery.trim().length > 0 || selectedGroup !== "all";
  const shouldShowAll = isExpanded || isFiltering;

  const filteredCategories = useMemo(() => {
    let result = ALL_CATEGORIES;

    // Filter by group
    if (selectedGroup !== "all") {
      result = result.filter((cat) => cat.group === selectedGroup);
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((cat) => {
        const nameMatch = cat.name.toLowerCase().includes(q);
        const descMatch = cat.description.toLowerCase().includes(q);
        const slugMatch = cat.slug.toLowerCase().includes(q);
        const popularMatch = cat.popularTools.some((t) => {
          const name = typeof t === "string" ? t : t.name;
          return name.toLowerCase().includes(q);
        });
        return nameMatch || descMatch || slugMatch || popularMatch;
      });
    }

    return result;
  }, [searchQuery, selectedGroup]);

  // Display subset or full list based on expand state
  const displayedCategories = useMemo(() => {
    if (shouldShowAll) {
      return filteredCategories;
    }
    // In collapsed mode, take up to featuredLimit
    return ALL_CATEGORIES.slice(0, featuredLimit);
  }, [shouldShowAll, filteredCategories, featuredLimit]);

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div className="w-full">
      {/* Category Search & Filter Toolbar */}
      <div className="mb-8 flex flex-col gap-4">
        {/* Search Bar: "search your category" */}
        <div className="relative max-w-xl mx-auto w-full">
          <label htmlFor="category-search" className="sr-only">
            Search your category
          </label>
          <div className="relative flex items-center">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground"
            />
            <input
              id="category-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your category (e.g. Developer Tools, Video, SEO, Marketing)..."
              className="h-11 sm:h-12 w-full rounded-2xl border border-white/10 bg-surface-1/80 pl-10 sm:pl-11 pr-10 text-xs sm:text-sm text-foreground placeholder:text-subtle-foreground shadow-sm backdrop-blur-md outline-none transition-colors focus:border-primary/70 focus:ring-1 focus:ring-primary/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear category search"
                className="absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Group Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {CATEGORY_GROUPS.map((group) => {
            const active = selectedGroup === group.id;
            const count =
              group.id === "all"
                ? ALL_CATEGORIES.length
                : ALL_CATEGORIES.filter((c) => c.group === group.id).length;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroup(group.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? "border border-primary/50 bg-primary/20 text-white shadow-[0_0_12px_-2px_rgba(112,34,252,0.4)]"
                    : "border border-border/80 bg-surface-1/60 text-muted-foreground hover:border-white/20 hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <span>{group.label}</span>
                <span className="ml-1.5 opacity-60 font-mono text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Results status banner */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span>
              {isFiltering
                ? `Found ${filteredCategories.length} ${filteredCategories.length === 1 ? "category" : "categories"} matching your filter`
                : shouldShowAll
                ? `Showing all ${ALL_CATEGORIES.length} verified categories`
                : `Showing ${displayedCategories.length} featured categories (of ${ALL_CATEGORIES.length} total)`}
            </span>
          </div>

          {!isFiltering && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-primary-content hover:text-white font-medium transition-colors"
            >
              <span>{isExpanded ? "Show featured (6)" : `View all ${ALL_CATEGORIES.length} categories`}</span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      {displayedCategories.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedCategories.map((category) => (
            <div key={category.slug} className="h-full">
              <CategoryCard
                name={category.name}
                slug={category.slug}
                icon={category.icon}
                description={category.description}
                toolCount={category.toolCount}
                popularTools={category.popularTools}
                className="h-full min-h-[160px] transition-transform duration-200 hover:-translate-y-1"
              />
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-white/10 bg-surface-1/60 p-8 sm:p-12 text-center backdrop-blur-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-foreground mb-4">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            No categories match &ldquo;{searchQuery}&rdquo;
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Try a different keyword or browse all 40+ curated software categories.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl border border-border bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface-3 transition-colors"
            >
              Clear search filter
            </button>
            <Link
              href="/submit"
              className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Suggest a category
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Toggle Button for Homepage */}
      {!isFiltering && !isExpanded && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-surface-1/90 px-5 py-3 text-sm font-semibold text-foreground shadow-sm hover:border-primary/50 hover:bg-surface-2 transition-all active:scale-95"
          >
            <Layers className="h-4 w-4 text-primary-content" />
            <span>Show all {ALL_CATEGORIES.length} AI & SaaS Categories</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
