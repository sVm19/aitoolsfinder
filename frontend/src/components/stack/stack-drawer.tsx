"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStack } from "./stack-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Layers,
  Trash2,
  GitCompare,
  ArrowRight,
  ShieldCheck,
  Bell,
  Sparkles,
} from "lucide-react";

export function StackDrawer() {
  const {
    savedTools,
    removeSave,
    clearStack,
    isDrawerOpen,
    closeDrawer,
    openAuthModal,
  } = useStack();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!isDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  // Calculate estimated monthly spend across tools with explicit "$XX/mo"
  const monthlyTotal = savedTools.reduce((acc, tool) => {
    if (!tool.startingPrice) return acc;
    const match = tool.startingPrice.match(/\$?(\d+)/);
    return match ? acc + parseInt(match[1], 10) : acc;
  }, 0);

  const handleCompareAll = () => {
    if (savedTools.length === 0) return;
    const params = new URLSearchParams();
    savedTools.slice(0, 4).forEach((t) => params.append("tool", t.slug));
    closeDrawer();
    router.push(`/compare/preview?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="My AI Stack"
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-background/95 p-6 shadow-2xl backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary-content border border-primary/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">My AI Stack</h2>
              <p className="text-xs text-subtle-foreground">
                {savedTools.length === 1
                  ? "1 tool shortlisted"
                  : `${savedTools.length} tools shortlisted`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Close My AI Stack drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sync & Price Alert Banner */}
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-3.5 text-xs text-muted-foreground flex items-start gap-3">
          <Bell className="h-4 w-4 shrink-0 text-primary-content mt-0.5" />
          <div className="flex-1">
            <span className="font-medium text-foreground block mb-0.5">
              Sync stack & track price changes
            </span>
            <p className="text-[11px] leading-relaxed">
              Your stack is currently saved in this browser. Sign in to back it up and get alerted if any of these tools change pricing.
            </p>
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                openAuthModal("Sign in to back up your AI Stack across devices and receive price alerts.");
              }}
              className="mt-2 text-xs font-semibold text-primary-content hover:underline inline-flex items-center gap-1"
            >
              Sign in to sync <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Tool List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {savedTools.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border bg-surface-1 text-muted-foreground mb-3">
                <Layers className="h-6 w-6 opacity-60" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Your stack is empty</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Click the bookmark icon on any tool card while exploring to shortlist tools for comparison.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => {
                  closeDrawer();
                  router.push("/explore");
                }}
              >
                Browse AI Tools
              </Button>
            </div>
          ) : (
            savedTools.map((tool) => (
              <div
                key={tool.slug}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-1/80 p-3 transition-colors hover:border-primary/40 hover:bg-surface-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border font-bold text-sm ${
                      tool.logoBg || "bg-surface-3 text-foreground"
                    }`}
                  >
                    {tool.logoLetter || tool.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/tools/${tool.slug}`}
                      onClick={closeDrawer}
                      className="font-semibold text-sm text-foreground hover:text-primary-content transition-colors truncate block"
                    >
                      {tool.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-subtle-foreground truncate">
                        {tool.category}
                      </span>
                      {tool.startingPrice && (
                        <span className="text-[10px] font-mono font-medium text-primary-content">
                          {tool.startingPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => removeSave(tool.slug)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md"
                    title={`Remove ${tool.name} from stack`}
                    aria-label={`Remove ${tool.name} from stack`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Spend Summary & Action Buttons */}
        {savedTools.length > 0 && (
          <div className="mt-auto border-t border-border/80 pt-4 space-y-3">
            {monthlyTotal > 0 && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-muted-foreground">Estimated Monthly Spend:</span>
                <span className="font-mono font-bold text-sm text-foreground">
                  ${monthlyTotal}/mo
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={clearStack}
                className="justify-center text-xs"
              >
                Clear Stack
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={savedTools.length < 2}
                onClick={handleCompareAll}
                className="justify-center text-xs shadow-lavender-glow disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  savedTools.length < 2
                    ? "Add at least 2 tools to compare"
                    : "Compare shortlisted tools side-by-side"
                }
              >
                <GitCompare className="h-3.5 w-3.5 mr-1.5" />
                {savedTools.length < 2 ? "Compare (2+ required)" : "Compare All"}
              </Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
