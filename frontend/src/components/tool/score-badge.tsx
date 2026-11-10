import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface ScoreBadgeProps {
  score: number; // e.g. 9.4
  label?: string;
  className?: string;
}

export function ScoreBadge({
  score,
  label = "Intelligence Score",
  className,
}: ScoreBadgeProps) {
  if (!Number.isFinite(score) || score < 0 || score > 10) return null;

  // Color scale based on score
  const getBadgeColor = (val: number) => {
    if (val >= 9.0) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
    if (val >= 8.0) return "text-primary-content bg-primary/15 border-primary/30";
    if (val >= 7.0) return "text-accent bg-accent/10 border-accent/25";
    return "text-muted-foreground bg-surface-3 border-border";
  };

  return (
    <Link
      href="/methodology"
      prefetch={false}
      aria-label={`${label}: ${score.toFixed(1)} out of 10. Read the scoring methodology.`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        getBadgeColor(score),
        className
      )}
    >
      <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 opacity-80" />
      <span>{score.toFixed(1)}</span>
      <span className="text-[10px] opacity-60 font-normal">/10</span>
    </Link>
  );
}

