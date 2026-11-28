"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export const TOOL_DOMAINS: Record<string, string> = {
  cursor: "cursor.com",
  "claude-code": "claude.ai",
  perplexity: "perplexity.ai",
  v0: "v0.dev",
  copilot: "github.com",
  "notion-ai": "notion.so",
  raycast: "raycast.com",
  groq: "groq.com",
  openrouter: "openrouter.ai",
  grammarly: "grammarly.com",
  jasper: "jasper.ai",
  "apollo-io": "apollo.io",
  adcreative: "adcreative.ai",
  surfer: "surferseo.com",
  writesonic: "writesonic.com",
  fathom: "fathom.video",
  gong: "gong.io",
  otter: "otter.ai",
  mutiny: "mutinyhq.com",
  "together-ai": "together.ai",
};

interface ToolLogoProps {
  slug: string;
  name: string;
  websiteUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ToolLogo({
  slug,
  name,
  websiteUrl,
  className,
  size = "md",
}: ToolLogoProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 min-w-8 text-xs",
    md: "h-11 w-11 min-w-11 text-base",
    lg: "h-14 w-14 min-w-14 text-xl",
  }[size];

  // Extract or resolve real product domain
  let domain = TOOL_DOMAINS[slug.toLowerCase().trim()];
  if (!domain && websiteUrl) {
    try {
      domain = new URL(websiteUrl).hostname.replace(/^www\./, "");
    } catch {
      // ignore
    }
  }

  // Real high-resolution official logo URL proxied with 1-year cache lifetime
  const realLogoUrl = domain
    ? `/api/logo?domain=${encodeURIComponent(domain)}`
    : null;

  // If real logo image is available and hasn't errored out, render real official image
  if (realLogoUrl && !hasError) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-border/80 shadow-sm overflow-hidden p-1.5 transition-transform duration-200",
          sizeClasses,
          className
        )}
        title={`${name} official logo`}
      >
        <img
          src={realLogoUrl}
          alt={`${name} official logo`}
          width={44}
          height={44}
          className="h-full w-full object-contain rounded-md"
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Fallback to verified brand SVG mark
  switch (slug) {
    case "cursor":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-black border border-white/20 shadow-md",
            sizeClasses,
            className
          )}
          title="Cursor"
        >
          <svg className="h-3/5 w-3/5" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              fill="#C4A3FD"
              stroke="#A855F7"
              strokeWidth="1.5"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="#FD8F32"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="#C4A3FD"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case "claude-code":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#2D1B18] border border-[#D97757]/40 shadow-md",
            sizeClasses,
            className
          )}
          title="Claude Code"
        >
          <svg className="h-3/5 w-3/5 fill-[#D97757]" viewBox="0 0 24 24">
            <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
            <circle cx="12" cy="11" r="2" fill="#FFE5DC" />
          </svg>
        </div>
      );

    case "perplexity":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#0F1E24] border border-[#20B8CD]/40 shadow-md",
            sizeClasses,
            className
          )}
          title="Perplexity AI"
        >
          <svg className="h-3/5 w-3/5 stroke-[#20B8CD]" viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <path d="M12 3V21M3 12H21M5.6 5.6L18.4 18.4M18.4 5.6L5.6 18.4" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" fill="#20B8CD" stroke="none" />
          </svg>
        </div>
      );

    case "v0":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-black border border-white/20 shadow-md",
            sizeClasses,
            className
          )}
          title="v0 by Vercel"
        >
          <svg className="h-3/5 w-3/5 fill-white" viewBox="0 0 24 24">
            <path d="M12 2L24 22H0L12 2Z" />
          </svg>
        </div>
      );

    case "copilot":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#0D1117] border border-[#238636]/40 shadow-md",
            sizeClasses,
            className
          )}
          title="GitHub Copilot"
        >
          <svg className="h-3/5 w-3/5 fill-[#58A6FF]" viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33s1.7.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z" />
          </svg>
        </div>
      );

    case "notion-ai":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-white border border-border shadow-md",
            sizeClasses,
            className
          )}
          title="Notion AI"
        >
          <span className="font-serif font-black text-black text-base">N</span>
        </div>
      );

    case "raycast":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#FF6363] text-white shadow-md",
            sizeClasses,
            className
          )}
          title="Raycast"
        >
          <svg className="h-3/5 w-3/5 fill-current" viewBox="0 0 24 24">
            <path d="M14.5 2L4 12.5L14.5 23L16 21.5L7 12.5L16 3.5L14.5 2Z" />
            <path d="M20 7L14.5 12.5L20 18L21.5 16.5L17.5 12.5L21.5 8.5L20 7Z" />
          </svg>
        </div>
      );

    case "groq":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#F55036] text-white shadow-md font-bold font-mono",
            sizeClasses,
            className
          )}
          title="Groq"
        >
          G
        </div>
      );

    case "openrouter":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md font-bold font-mono",
            sizeClasses,
            className
          )}
          title="OpenRouter"
        >
          OR
        </div>
      );

    case "grammarly":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#15C39A] text-white shadow-md font-bold",
            sizeClasses,
            className
          )}
          title="Grammarly"
        >
          G
        </div>
      );

    case "jasper":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md font-bold",
            sizeClasses,
            className
          )}
          title="Jasper"
        >
          J
        </div>
      );

    case "apollo-io":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#FFE4D6] border border-[#FD8F32]/50 text-[#FD8F32] shadow-md font-black",
            sizeClasses,
            className
          )}
          title="Apollo AI"
        >
          A
        </div>
      );

    case "adcreative":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#E11D48] text-white shadow-md font-black",
            sizeClasses,
            className
          )}
          title="AdCreative.ai"
        >
          <svg className="h-3/5 w-3/5 fill-white" viewBox="0 0 24 24">
            <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
            <circle cx="19" cy="5" r="1.5" />
            <circle cx="5" cy="19" r="1.5" />
          </svg>
        </div>
      );

    case "surfer":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00D2FF] to-[#3A7BD5] text-white shadow-md font-bold",
            sizeClasses,
            className
          )}
          title="Surfer SEO"
        >
          <svg className="h-3/5 w-3/5 stroke-white fill-none stroke-[2.2]" viewBox="0 0 24 24">
            <path d="M2 12C5 8 9 8 12 12C15 16 19 16 22 12" strokeLinecap="round" />
            <path d="M2 17C5 13 9 13 12 17C15 21 19 21 22 17" strokeLinecap="round" />
          </svg>
        </div>
      );

    case "writesonic":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#6941C6] text-white shadow-md font-bold",
            sizeClasses,
            className
          )}
          title="Writesonic"
        >
          <svg className="h-3/5 w-3/5 fill-white" viewBox="0 0 24 24">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
          </svg>
        </div>
      );

    case "fathom":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#1A1F36] border border-[#635BFF]/40 text-[#635BFF] shadow-md",
            sizeClasses,
            className
          )}
          title="Fathom Video AI"
        >
          <svg className="h-3/5 w-3/5 stroke-[#635BFF] fill-none stroke-2" viewBox="0 0 24 24">
            <path d="M12 3V21M7 7V17M17 7V17M2 11V13M22 11V13" strokeLinecap="round" />
          </svg>
        </div>
      );

    case "gong":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#7B1FA2] text-white shadow-md font-bold",
            sizeClasses,
            className
          )}
          title="Gong.io"
        >
          <svg className="h-3/5 w-3/5 fill-current" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="12" cy="12" r="4" fill="#FFD54F" />
          </svg>
        </div>
      );

    case "otter":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#1976D2] text-white shadow-md font-bold",
            sizeClasses,
            className
          )}
          title="Otter.ai"
        >
          <span className="font-sans font-black text-lg">O</span>
        </div>
      );

    case "mutiny":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[#0D1117] border border-[#FF5C00]/40 text-[#FF5C00] shadow-md font-black font-mono",
            sizeClasses,
            className
          )}
          title="Mutiny"
        >
          M
        </div>
      );

    case "together-ai":
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-black border border-white/25 text-white shadow-md",
            sizeClasses,
            className
          )}
          title="Together AI"
        >
          <svg className="h-3/5 w-3/5 fill-none stroke-white stroke-2" viewBox="0 0 24 24">
            <circle cx="6" cy="12" r="3" fill="white" />
            <circle cx="18" cy="12" r="3" fill="white" />
            <circle cx="12" cy="6" r="3" fill="#C4A3FD" />
            <path d="M6 12L12 6M18 12L12 6M6 12H18" stroke="#C4A3FD" strokeWidth="1.5" />
          </svg>
        </div>
      );

    default:
      return (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border border-border bg-surface-3 text-foreground font-bold shadow-sm",
            sizeClasses,
            className
          )}
        >
          {name.charAt(0)}
        </div>
      );
  }
}
