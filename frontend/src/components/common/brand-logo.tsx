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
      viewBox="0 0 256 256"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brand-grad-violet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="brand-grad-orange" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF5E1E" />
          <stop offset="100%" stopColor="#FFA043" />
        </linearGradient>
      </defs>
      {/* Left Vanguard Blade */}
      <path
        d="M124 26 L24 206 L66 206 L124 104 Z"
        fill="url(#brand-grad-violet)"
      />
      {/* Right Vanguard Blade */}
      <path
        d="M132 26 L132 104 L190 206 L232 206 Z"
        fill="url(#brand-grad-orange)"
      />
      {/* Precision Diamond Aperture */}
      <polygon
        points="128,138 152,162 128,186 104,162"
        fill="#FF5E1E"
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
      icon: "w-4 h-4",
      title: "text-sm",
      sub: "text-[8px] tracking-[0.2em] -mt-0.5",
    },
    md: {
      box: "h-9 w-9 rounded-lg",
      icon: "w-5 h-5",
      title: "text-base",
      sub: "text-[9.5px] tracking-[0.24em] -mt-1",
    },
    lg: {
      box: "h-11 w-11 rounded-xl",
      icon: "w-6 h-6",
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
            className={`${currentSize.title} font-extrabold tracking-[-0.035em] text-foreground transition-colors duration-200 group-hover:text-white`}
          >
            AIToolsFinder
            <span className="text-accent font-black">.</span>
          </span>
          <span
            className={`${currentSize.sub} font-mono font-semibold text-subtle-foreground uppercase`}
          >
            Intelligence
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
