"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export type PopularToolItem = string | { name: string; slug: string };

interface CategoryCardProps {
  name: string;
  slug: string;
  description?: string;
  toolCount?: number;
  icon?: React.ReactNode;
  popularTools?: PopularToolItem[];
  className?: string;
}

export function CategoryCard({
  name,
  slug,
  description,
  toolCount,
  icon,
  popularTools,
  className,
}: CategoryCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
    el.style.setProperty("--rx", `${(py - 0.5) * -6}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 8}deg`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        "spotlight-card tilt-card group relative flex flex-col justify-between rounded-2xl border border-border p-5 transition-colors duration-200 hover:border-primary/60 bg-surface-1/60",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <Link
            href={`/categories/${slug}`}
            prefetch={false}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-3 text-primary-content group-hover:border-primary/40 group-hover:text-foreground transition-colors"
          >
            {icon || <Layers className="w-5 h-5" />}
          </Link>
          {toolCount !== undefined && (
            <Link
              href={`/categories/${slug}`}
              prefetch={false}
              className="rounded border border-border/60 bg-surface-2 px-2 py-0.5 font-mono text-xs text-subtle-foreground hover:text-foreground transition-colors"
            >
              {toolCount} {toolCount === 1 ? "tool" : "tools"}
            </Link>
          )}
        </div>

        <Link
          href={`/categories/${slug}`}
          prefetch={false}
          className="font-semibold text-foreground group-hover:text-primary-content transition-colors text-base mb-1 block"
        >
          {name}
        </Link>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        {popularTools && popularTools.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {popularTools.map((tool) => {
              const toolName = typeof tool === "string" ? tool : tool.name;
              const toolSlug =
                typeof tool === "string"
                  ? tool.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
                  : tool.slug;

              return (
                <Link
                  key={toolSlug}
                  href={`/tools/${toolSlug}`}
                  prefetch={false}
                  className="rounded-md border border-border/70 bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-subtle-foreground transition-all hover:border-primary/60 hover:bg-surface-3 hover:text-foreground active:scale-95"
                >
                  {toolName}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border/40 pt-3">
        <Link
          href={`/categories/${slug}`}
          prefetch={false}
          className="flex items-center justify-between text-xs font-medium text-primary-content hover:text-white transition-colors"
        >
          <span>Browse {name.toLowerCase()}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

