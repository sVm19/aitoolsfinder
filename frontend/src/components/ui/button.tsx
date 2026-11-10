import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "outline"
    | "ghost"
    | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-hover hover:shadow-lavender-glow border border-primary/50",
      secondary:
        "bg-surface-2 text-foreground hover:bg-surface-3 hover:text-white border border-border",
      accent:
        "bg-accent text-background font-semibold hover:bg-accent-hover hover:shadow-orange-glow border border-accent/50",
      outline:
        "bg-transparent text-foreground hover:bg-surface-2 border border-border hover:border-primary/60",
      ghost:
        "bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface-2",
      destructive:
        "bg-red-600 text-white hover:bg-red-500 border border-red-500/50",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5 font-semibold",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };

