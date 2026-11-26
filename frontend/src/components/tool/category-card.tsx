"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export type PopularToolItem = string | { name: string; slug: string };

interface CategoryCardProps {
  name: string;
  slug: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function CategoryCard({
  name,
  slug,
  description,
  icon,
  className,
}: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${slug}`}
      prefetch={false}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-surface-1/70 p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-3 text-primary-content transition-colors group-hover:border-primary/40 group-hover:text-foreground">
        {icon || <Layers className="h-4 w-4" />}
      </span>

      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary-content">
          {name}
        </span>
        {description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <ArrowRight
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary-content"
      />
    </Link>
  );
}
