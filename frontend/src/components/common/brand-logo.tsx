import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  linkHref?: string;
  animateOnHover?: boolean;
}

export function BrandSymbol({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="16 16 224 224"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="orbit-violet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="stack-orange" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF5E1E" />
          <stop offset="100%" stopColor="#FFA043" />
        </linearGradient>
      </defs>
      {/* Outer Precision Circular Orbit Ring */}
      <path
        fill="url(#orbit-violet)"
        fillRule="evenodd"
        d="M128 20 C187.646 20 236 68.354 236 128 C236 187.646 187.646 236 128 236 C68.354 236 20 187.646 20 128 C20 68.354 68.354 20 128 20 Z M128 36 C77.19 36 36 77.19 36 128 C36 178.81 77.19 220 128 220 C178.81 220 220 178.81 220 128 C220 77.19 178.81 36 128 36 Z"
      />
      {/* Tier 1: Top Floating Stack Plate (Active Tool Tier - Radiant Orange) */}
      <path
        fill="url(#stack-orange)"
        d="M128 64 L180 94 L128 124 L76 94 Z"
      />
      {/* Tier 2: Middle Stack Plate (Intelligence Workflow Tier - Electric Violet) */}
      <path
        fill="url(#orbit-violet)"
        d="M76 118 L128 148 L180 118 L180 134 L128 164 L76 134 Z"
      />
      {/* Tier 3: Bottom Foundation Plate (Infrastructure Tier - Electric Violet) */}
      <path
        fill="url(#orbit-violet)"
        d="M76 152 L128 182 L180 152 L180 168 L128 198 L76 168 Z"
      />
    </svg>
  );
}

export function BrandLogo({
  className = "",
  size = "md",
  showWordmark = true,
  linkHref = "/",
  animateOnHover = true,
}: BrandLogoProps) {
  const sizeMap = {
    sm: {
      box: "h-7 w-7 rounded-md",
      icon: "w-[23px] h-[23px]",
      title: "text-sm",
      sub: "text-[8px] tracking-[0.2em] -mt-0.5",
    },
    md: {
      box: "h-9 w-9 rounded-lg",
      icon: "w-[30px] h-[30px]",
      title: "text-base",
      sub: "text-[9.5px] tracking-[0.24em] -mt-1",
    },
    lg: {
      box: "h-11 w-11 rounded-xl",
      icon: "w-[37px] h-[37px]",
      title: "text-lg",
      sub: "text-[11px] tracking-[0.26em] -mt-0.5",
    },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 group ${className}`}>
      {/* Architectural Logo Mark Box */}
      <div
        className={`flex ${currentSize.box} items-center justify-center bg-surface-2 border border-border/80 shadow-lavender-glow transition-all duration-300 ${
          animateOnHover
            ? "group-hover:border-primary/50 group-hover:shadow-[0_0_24px_-2px_rgba(124,58,237,0.45)] group-hover:scale-105"
            : ""
        }`}
      >
        <BrandSymbol className={currentSize.icon} />
      </div>

      {showWordmark && (
        <div className="flex flex-col text-left select-none">
          <span
            className={`${currentSize.title} font-mono font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-white`}
          >
            aiToolsFinder
            <span className="text-accent font-black">.</span>
          </span>
          <span
            className={`${currentSize.sub} font-mono font-semibold text-subtle-foreground uppercase tracking-[0.24em]`}
          >
            Cloud
          </span>
        </div>
      )}
    </div>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} data-nav-brand className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
