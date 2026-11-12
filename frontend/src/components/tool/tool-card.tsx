"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/tool/score-badge";
import { Bookmark, GitCompare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/components/comparison/compare-provider";

export interface ToolCardData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  categorySlug: string;
  pricingModel: "free" | "freemium" | "paid" | "usage_based" | "contact_sales" | "unknown";
  startingPrice?: string;
  score?: number;
  isVerified?: boolean;
  isSponsored?: boolean;
  logoLetter?: string;
  logoBg?: string;
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
  isSaved = false,
}: ToolCardProps) {
  const { tools: compareTools, addTool, removeTool, isFull } = useCompare();
  const isComparing = compareTools.some((item) => item.slug === tool.slug);
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

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 transition-all duration-300 hover:border-primary/60 hover:bg-surface-2 hover:shadow-lavender-glow",
        tool.isSponsored && "border-accent/40 bg-surface-2/50",
        className
      )}
    >
      <div>
        {/* Top Header: Logo, Name, Badges & Save action */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Neutral surface tile with clean monogram mark */}
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-base font-bold shadow-sm transition-transform duration-200 group-hover:scale-105",
                tool.logoBg || "bg-surface-3 text-foreground"
              )}
            >
              {tool.logoLetter || tool.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/tools/${tool.slug}`}
                  prefetch={false}
                  className="font-semibold text-foreground hover:text-primary-content transition-colors"
                >
                  {tool.name}
                </Link>
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
                  className="text-xs text-subtle-foreground hover:text-muted-foreground transition-colors"
                >
                  {tool.category}
                </Link>
              ) : (
                <span className="text-xs text-subtle-foreground">{tool.category}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
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
                  "rounded-md p-1.5 text-subtle-foreground transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40",
                  isComparing && "bg-primary/15 text-primary-content",
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
              {onSave && (
                <button
                  type="button"
                  onClick={() => onSave(tool)}
                  aria-pressed={isSaved}
                  className="rounded-md p-1.5 text-subtle-foreground transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={isSaved ? `Remove ${tool.name} from saved tools` : `Save ${tool.name}`}
                  title={isSaved ? "Remove from saved tools" : "Save tool"}
                >
                  <Bookmark aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
          </div>
        </div>

        {/* Tagline / Factual Summary */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4 min-h-[40px]">
          {tool.tagline}
        </p>
      </div>

      {/* Footer Info: Pricing, Intelligence Score, View details */}
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
          <Link
            href={`/tools/${tool.slug}`}
              prefetch={false}
            className="p-1 text-subtle-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
            aria-label={`View ${tool.name} profile`}
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

