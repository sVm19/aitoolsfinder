"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

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
  disableGsapHover?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      disableGsapHover = false,
      children,
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = React.useRef<HTMLButtonElement>(null);
    const sheenRef = React.useRef<HTMLSpanElement>(null);
    const borderRef = React.useRef<HTMLSpanElement>(null);

    React.useImperativeHandle(
      forwardedRef,
      () => internalRef.current as HTMLButtonElement
    );

    const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerEnter?.(e);
      if (disableGsapHover || props.disabled) return;
      const btn = internalRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        btn.style.setProperty("--btn-mx", `${e.clientX - rect.left}px`);
        btn.style.setProperty("--btn-my", `${e.clientY - rect.top}px`);
      }
      if (sheenRef.current) {
        gsap.to(sheenRef.current, { opacity: 1, duration: 0.2, ease: "earlyst-out", overwrite: "auto" });
      }
      if (borderRef.current) {
        gsap.to(borderRef.current, { opacity: 1, duration: 0.2, ease: "earlyst-out", overwrite: "auto" });
      }
      if (!prefersReducedMotion()) {
        gsap.to(btn, { y: -2, duration: 0.2, ease: "earlyst-out", overwrite: "auto" });
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerMove?.(e);
      if (disableGsapHover || props.disabled) return;
      const btn = internalRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        btn.style.setProperty("--btn-mx", `${e.clientX - rect.left}px`);
        btn.style.setProperty("--btn-my", `${e.clientY - rect.top}px`);
      }
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(e);
      if (disableGsapHover || props.disabled) return;
      const btn = internalRef.current;
      if (sheenRef.current) {
        gsap.to(sheenRef.current, { opacity: 0, duration: 0.22, ease: "earlyst-out", overwrite: "auto" });
      }
      if (borderRef.current) {
        gsap.to(borderRef.current, { opacity: 0, duration: 0.22, ease: "earlyst-out", overwrite: "auto" });
      }
      if (btn && !prefersReducedMotion()) {
        gsap.to(btn, { y: 0, scale: 1, duration: 0.22, ease: "earlyst-out", overwrite: "auto" });
      }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e);
      if (disableGsapHover || props.disabled || prefersReducedMotion()) return;
      if (internalRef.current) {
        gsap.to(internalRef.current, { scale: 0.97, y: 0, duration: 0.1, ease: "earlyst-snap", overwrite: "auto" });
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerUp?.(e);
      if (disableGsapHover || props.disabled || prefersReducedMotion()) return;
      if (internalRef.current) {
        gsap.to(internalRef.current, { scale: 1, y: -2, duration: 0.18, ease: "earlyst-spring", overwrite: "auto" });
      }
    };

    const baseStyles =
      "group relative overflow-hidden inline-flex max-w-full items-center justify-center font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none text-center leading-normal text-ellipsis sm:whitespace-nowrap";

    const variants = {
      primary:
        "bg-primary text-primary-foreground font-semibold hover:bg-primary-hover hover:shadow-lavender-glow border border-primary/50 shadow-sm",
      secondary:
        "bg-surface-2 text-foreground hover:bg-surface-3 hover:text-white border border-border shadow-sm",
      accent:
        "bg-accent text-accent-foreground font-semibold hover:bg-accent-hover hover:shadow-orange-glow border border-accent/50 shadow-sm",
      outline:
        "bg-transparent text-foreground hover:bg-surface-2 border border-border hover:border-primary/60",
      ghost:
        "bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface-2",
      destructive:
        "bg-red-600 text-white hover:bg-red-500 border border-red-500/50",
    };

    const sizes = {
      sm: "min-h-[40px] sm:min-h-[34px] px-3 py-1.5 text-xs gap-1.5",
      md: "min-h-[44px] sm:min-h-[40px] px-4 py-2 text-sm gap-2",
      lg: "min-h-[48px] px-6 py-2.5 text-base gap-2.5 font-semibold",
      icon: "min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] p-0 shrink-0",
    };

    return (
      <button
        ref={internalRef}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        <span ref={sheenRef} className="gsap-btn-sheen" aria-hidden="true" />
        <span
          ref={borderRef}
          className="gsap-btn-border-sweep"
          aria-hidden="true"
        />
        <span className="relative z-10 inline-flex items-center justify-center gap-inherit">
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
