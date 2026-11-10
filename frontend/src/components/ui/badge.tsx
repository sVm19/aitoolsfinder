import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "verified"
    | "sponsored"
    | "accent"
    | "free"
    | "freemium"
    | "paid";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors select-none";

  const variants = {
    default: "bg-surface-3 text-foreground border border-border",
    secondary: "bg-surface-2 text-muted-foreground border border-border/60",
    outline: "bg-transparent text-muted-foreground border border-border",
    verified:
      "bg-primary/15 text-primary-content border border-primary/35 font-semibold",
    sponsored:
      "bg-accent/15 text-accent border border-accent/35 font-semibold uppercase tracking-wider text-[10px]",
    accent: "bg-accent/20 text-accent border border-accent/40",
    free: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    freemium: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
    paid: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}

