"use client";

import React, { useState } from "react";
import { Check, Copy, Code2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FounderBadgeCardProps {
  toolName: string;
  toolSlug: string;
  score?: number;
}

export function FounderBadgeCard({
  toolName,
  toolSlug,
  score = 94,
}: FounderBadgeCardProps) {
  const [copiedType, setCopiedType] = useState<"html" | "md" | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const siteUrl = "https://aitoolsfinder.cloud";
  const badgeUrl = `${siteUrl}/badges/verified-${theme}.svg`;
  const toolUrl = `${siteUrl}/tools/${toolSlug}`;

  const htmlCode = `<a href="${toolUrl}" target="_blank" rel="noopener noreferrer"><img src="${badgeUrl}" alt="Verified on AIToolsFinder" width="180" height="40" /></a>`;
  const mdCode = `[![Verified on AIToolsFinder](${badgeUrl})](${toolUrl})`;

  const handleCopy = (type: "html" | "md", text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-surface-1/90 p-5 sm:p-6 shadow-lavender-glow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary-content border border-primary/40">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Are you the creator of {toolName}?
            </h3>
            <p className="text-xs text-muted-foreground">
              Embed this verified trust badge on your website or GitHub README for backlink & traffic verification.
            </p>
          </div>
        </div>

        {/* Theme switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1 text-xs self-start sm:self-center">
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              theme === "dark"
                ? "bg-surface-3 text-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              theme === "light"
                ? "bg-surface-3 text-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Light
          </button>
        </div>
      </div>

      {/* Live Badge Preview (Nick Launches style) */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border/80 bg-background/90 p-4">
        {/* Rendered SVG Simulation */}
        <div
          className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
            theme === "dark"
              ? "border-primary/50 bg-black text-white"
              : "border-border bg-white text-zinc-900"
          }`}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-hover text-white">
            <Sparkles className="h-3 w-3" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-accent leading-none">
              Verified
            </span>
            <span className="text-xs font-bold leading-tight">AIToolsFinder</span>
          </div>
          <div className="ml-1 pl-2 border-l border-white/20 font-mono text-[11px] text-primary-content">
            ★ {score}
          </div>
        </div>

        {/* Copy Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => handleCopy("html", htmlCode)}
            className="flex-1 sm:flex-none justify-center text-xs"
          >
            {copiedType === "html" ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Copied HTML
              </>
            ) : (
              <>
                <Code2 className="h-3.5 w-3.5 mr-1" /> Copy HTML
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => handleCopy("md", mdCode)}
            className="flex-1 sm:flex-none justify-center text-xs"
          >
            {copiedType === "md" ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Copied MD
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy Markdown
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
