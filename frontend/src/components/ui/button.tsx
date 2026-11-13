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
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98] whitespace-nowrap text-center leading-normal";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-hover hover:shadow-lavender-glow border border-primary/50 shadow-sm",
      secondary:
        "bg-surface-2 text-foreground hover:bg-surface-3 hover:text-white border border-border shadow-sm",
      accent:
        "bg-accent text-background font-semibold hover:bg-accent-hover hover:shadow-orange-glow border border-accent/50 shadow-sm",
      outline:
        "bg-transparent text-foreground hover:bg-surface-2 border border-border hover:border-primary/60",
      ghost:
        "bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface-2",
      destructive:
        "bg-red-600 text-white hover:bg-red-500 border border-red-500/50",
    };

    const sizes = {
      sm: "min-h-[38px] sm:min-h-[34px] px-3.5 py-1.5 text-xs gap-1.5",
      md: "min-h-[44px] sm:min-h-[40px] px-4 py-2 text-sm gap-2",
      lg: "min-h-[48px] px-6 py-2.5 text-base gap-2.5 font-semibold",
      icon: "min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] p-0 shrink-0",
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

