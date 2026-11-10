import React from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  name: string;
  slug: string;
  description?: string;
  toolCount?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function CategoryCard({
  name,
  slug,
  description,
  toolCount,
  icon,
  className,
}: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${slug}`}
      prefetch={false}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 transition-all duration-200 hover:border-primary/60 hover:bg-surface-2 hover:shadow-lavender-glow",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-3 text-primary-content group-hover:border-primary/40 group-hover:text-foreground transition-colors">
            {icon || <Layers className="w-5 h-5" />}
          </div>
          {toolCount !== undefined && (
            <span className="rounded border border-border/60 bg-surface-2 px-2 py-0.5 font-mono text-xs text-subtle-foreground">
              {toolCount} {toolCount === 1 ? "tool" : "tools"}
            </span>
          )}
        </div>

        <h4 className="font-semibold text-foreground group-hover:text-primary-content transition-colors text-base mb-1">
          {name}
        </h4>
        {description && (
          <p className="text-xs text-subtle-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t border-border/40 pt-3 text-xs font-medium text-primary-content opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
        <span>Browse category</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

