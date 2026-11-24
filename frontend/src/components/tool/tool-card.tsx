"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/tool/score-badge";
import { ToolLogo } from "@/components/tool/tool-logo";
import { Heart, GitCompare, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/components/comparison/compare-provider";
import { useStack } from "@/components/stack/stack-provider";

export interface ToolCardData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  categorySlug: string;
  pricingModel: "free" | "freemium" | "paid" | "usage_based" | "contact_sales" | "unknown";
  startingPrice?: string;
  websiteUrl?: string;
  score?: number;
  isVerified?: boolean;
  isSponsored?: boolean;
  logoLetter?: string;
  logoBg?: string;
  upvotes?: number;
  bestFor?: string;
  alternativeTo?: { name: string; slug: string };
  replacesAnchoring?: string;
  cohort?: string;
}

interface ToolCardProps {
  tool: ToolCardData;
  className?: string;
  onSave?: (tool: ToolCardData) => void;
  onCompare?: (tool: ToolCardData) => void;
  isSaved?: boolean;
}

export function ToolCard({
  tool,
  className,
  onSave,
  onCompare,
  isSaved: propIsSaved,
}: ToolCardProps) {
  const { tools: compareTools, addTool, removeTool, isFull } = useCompare();
  const {
    isSaved: stackIsSaved,
    toggleSave,
    isUpvoted,
    toggleUpvote,
    getUpvoteCount,
  } = useStack();

  const isComparing = compareTools.some((item) => item.slug === tool.slug);
  const isSaved = propIsSaved !== undefined ? propIsSaved : stackIsSaved(tool.slug);
  const upvoted = isUpvoted(tool.slug);
  const upvoteCount = getUpvoteCount(tool.slug, tool.upvotes);

  const getPricingBadgeVariant = (model: string) => {
    switch (model) {
      case "free":
        return "free";
      case "freemium":
        return "freemium";
      case "paid":
        return "paid";
      default:
        return "outline";
    }
  };

  const getPricingLabel = (model: string) => {
    switch (model) {
      case "free":
        return "Free";
      case "freemium":
        return "Freemium";
      case "paid":
        return "Paid";
      case "usage_based":
        return "Usage-Based";
      case "contact_sales":
        return "Contact sales";
      case "unknown":
        return "Pricing unknown";
      default:
        return "Custom";
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) {
      onSave(tool);
    } else {
      toggleSave(tool);
    }
  };

  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleUpvote(tool.slug, tool.name);
  };

  // Default intelligent teardown note based on category/tagline if not explicitly provided
  const teardownNote =
    tool.bestFor ||
    (tool.category === "Developer Tools"
      ? "Engineers looking for deep codebase intelligence & fast autocomplete"
      : tool.category === "Productivity"
      ? "Teams streamlining workspace workflows & meeting action items"
      : tool.category === "Marketing"
      ? "Growth teams optimizing campaign copy & conversion velocity"
      : tool.category === "Writing & SEO"
      ? "Content teams generating grounded drafts with citation evidence"
      : tool.category === "AI & Models"
      ? "Developers benchmarking foundation models & API inference speeds"
      : "Professionals seeking verified software with published pricing");

  const anchoringTag =
    tool.replacesAnchoring ||
    (tool.alternativeTo ? `Replaces ${tool.alternativeTo.name}` : null) ||
    (tool.slug === "cursor"
      ? "Replaces GitHub Copilot ($19/mo)"
      : tool.slug === "v0"
      ? "Replaces manual React scaffolding"
      : tool.slug === "perplexity"
      ? "Replaces multi-tab Google search"
      : tool.slug === "claude-code"
      ? "Replaces $500/mo autonomous agent tools"
      : null);

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-border bg-surface-1/90 p-5 transition-all duration-300 hover:border-primary/60 hover:bg-surface-2 hover:shadow-lavender-glow",
        tool.isSponsored && "border-accent/40 bg-surface-2/50",
        className
      )}
    >
      <div>
        {/* Top Header: Logo, Name, Category & Interactive Upvote */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Real Logo Linking Directly to Product Website */}
            {tool.websiteUrl ? (
              <a
                href={tool.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                title={`Visit official ${tool.name} website`}
              >
                <ToolLogo
                  slug={tool.slug}
                  name={tool.name}
                  websiteUrl={tool.websiteUrl}
                />
              </a>
            ) : (
              <Link
                href={`/tools/${tool.slug}`}
                prefetch={false}
                tabIndex={-1}
                aria-hidden="true"
                className="shrink-0 transition-transform duration-200 group-hover:scale-105"
              >
                <ToolLogo
                  slug={tool.slug}
                  name={tool.name}
                />
              </Link>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/tools/${tool.slug}`}
                  prefetch={false}
                  className="font-semibold text-foreground hover:text-primary-content transition-colors truncate"
                >
                  {tool.name}
                </Link>
                {tool.websiteUrl && (
                  <a
                    href={tool.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-accent/15 text-accent hover:bg-accent hover:text-white transition-colors"
                    title={`Visit official ${tool.name} website (opens in new tab)`}
                    aria-label={`Visit official ${tool.name} website (opens in new tab)`}
                  >
                    <span>Visit</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
                {tool.isVerified && (
                  <Badge variant="verified" className="text-[10px] px-1.5 py-0">
                    Verified
                  </Badge>
                )}
                {tool.isSponsored && (
                  <Badge variant="sponsored" className="text-[9px] px-1.5 py-0">
                    Sponsored
                  </Badge>
                )}
              </div>
              {tool.categorySlug ? (
                <Link
                  href={`/categories/${tool.categorySlug}`}
                  prefetch={false}
                  className="text-xs text-subtle-foreground hover:text-muted-foreground transition-colors block truncate mt-0.5"
                >
                  {tool.category}
                </Link>
              ) : (
                <span className="text-xs text-subtle-foreground block truncate mt-0.5">
                  {tool.category}
                </span>
              )}
            </div>
          </div>

          {/* Upvote & Action Bar (MicroLaunch / Nick Launches style) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Interactive Upvote Pill */}
            <button
              type="button"
              onClick={handleUpvoteClick}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all active:scale-95",
                upvoted
                  ? "border-accent/60 bg-accent/15 text-accent shadow-[0_0_12px_rgba(253,143,50,0.2)]"
                  : "border-border bg-surface-2/80 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-surface-3"
              )}
              title={upvoted ? "Remove upvote" : `Upvote ${tool.name}`}
              aria-label={upvoted ? `Upvoted ${tool.name}` : `Upvote ${tool.name}`}
            >
              <span className={cn("text-[10px] transition-transform", upvoted && "-translate-y-0.5 font-bold")}>
                ▲
              </span>
              <span className="font-mono text-xs">{upvoteCount}</span>
            </button>

            {/* Compare Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isComparing) removeTool(tool.slug);
                else {
                  addTool(tool);
                  onCompare?.(tool);
                }
              }}
              disabled={!isComparing && isFull}
              aria-pressed={isComparing}
              title={isComparing ? "Remove from compare" : isFull ? "Compare tray is full" : "Add to compare"}
              className={cn(
                "rounded-lg p-1.5 text-subtle-foreground transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40",
                isComparing && "bg-primary/15 text-primary-content"
              )}
              aria-label={
                isComparing
                  ? `Remove ${tool.name} from compare`
                  : isFull
                  ? `Compare tray is full; ${tool.name} was not added`
                  : `Add ${tool.name} to compare`
              }
            >
              <GitCompare aria-hidden="true" className="h-4 w-4" />
            </button>

            {/* Favorite / Like Heart Button -> Saves to My AI Stack */}
            <button
              type="button"
              onClick={handleSaveClick}
              aria-pressed={isSaved}
              className={cn(
                "group/fav flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
                isSaved
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                  : "text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent"
              )}
              aria-label={isSaved ? `Remove ${tool.name} from My AI Stack` : `Save ${tool.name} to My AI Stack`}
              title={isSaved ? "Saved in My AI Stack (Click to remove)" : "Favorite & Save to My AI Stack"}
            >
              <Heart
                aria-hidden="true"
                className={cn(
                  "h-4 w-4 transition-transform group-hover/fav:scale-110",
                  isSaved ? "fill-rose-500 text-rose-500" : "text-neutral-400 group-hover/fav:text-rose-400"
                )}
              />
              <span className={cn("hidden sm:inline text-[11px]", isSaved ? "font-semibold text-rose-400" : "text-neutral-400")}>
                {isSaved ? "Saved" : "Save"}
              </span>
            </button>
          </div>
        </div>

        {/* Tagline / Factual Summary */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3 min-h-[40px]">
          {tool.tagline}
        </p>

        {/* Competitor Price Anchoring / Value Tag */}
        {anchoringTag && (
          <div className="mb-2.5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">{anchoringTag}</span>
          </div>
        )}

        {/* Micro-Teardown Insight Box (MicroSaaS Examples style) */}
        <div className="mb-4 rounded-lg border border-border/60 bg-surface-2/40 px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
          <span className="text-[10px] font-semibold text-primary-content uppercase tracking-wider shrink-0 font-mono">
            Best for
          </span>
          <span className="truncate text-foreground/90 font-medium">
            {teardownNote}
          </span>
        </div>
      </div>

      {/* Footer Info: Pricing, Intelligence Score, and Direct Product Visit Button */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={getPricingBadgeVariant(tool.pricingModel)}>
            {getPricingLabel(tool.pricingModel)}
          </Badge>
          {tool.startingPrice && (
            <span className="text-xs text-subtle-foreground font-mono">
              from {tool.startingPrice}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {tool.score && <ScoreBadge score={tool.score} />}

          {/* Prominent Real Product Redirect Button */}
          {tool.websiteUrl ? (
            <a
              href={tool.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm transition-all active:scale-95"
              title={`Directly open official ${tool.name} product`}
            >
              <span>Visit</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          ) : (
            <Link
              href={`/tools/${tool.slug}`}
              prefetch={false}
              className="p-1 text-subtle-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
              aria-label={`View ${tool.name} profile`}
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
