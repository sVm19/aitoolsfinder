"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Check, RefreshCw, Zap, ShieldCheck, Scale, ExternalLink } from "lucide-react";

type JobCategory = "code" | "writing" | "speed" | "analytics" | "marketing";
type Constraint = "free" | "benchmark" | "budget" | "team";

interface ToolMatch {
  name: string;
  slug: string;
  category: string;
  matchScore: number;
  pricing: string;
  pricingType: "free" | "freemium" | "paid";
  why: string;
  runnerUp: {
    name: string;
    slug: string;
  };
  compareSlug: string;
}

const MATCH_DATABASE: Record<JobCategory, Record<Constraint, ToolMatch>> = {
  code: {
    free: {
      name: "v0 by Vercel",
      slug: "v0",
      category: "Generative UI & Frontend",
      matchScore: 97.4,
      pricing: "Free tier with 200 daily credits",
      pricingType: "freemium",
      why: "Generates production-grade React & Tailwind UI directly in browser with no initial cost.",
      runnerUp: { name: "Cursor", slug: "cursor" },
      compareSlug: "cursor-vs-v0",
    },
    benchmark: {
      name: "Cursor",
      slug: "cursor",
      category: "AI Code Editor & Agent",
      matchScore: 99.2,
      pricing: "Freemium · $20/mo Pro",
      pricingType: "freemium",
      why: "Top frontier reasoning with Claude 3.7 Sonnet & Composer multi-file repository indexing.",
      runnerUp: { name: "GitHub Copilot", slug: "copilot" },
      compareSlug: "cursor-vs-copilot",
    },
    budget: {
      name: "Cursor",
      slug: "cursor",
      category: "AI Code Editor",
      matchScore: 98.6,
      pricing: "$20/mo for 500 fast requests",
      pricingType: "freemium",
      why: "Replaces 3 separate dev extensions into a single unified IDE workflow.",
      runnerUp: { name: "v0 by Vercel", slug: "v0" },
      compareSlug: "cursor-vs-v0",
    },
    team: {
      name: "GitHub Copilot",
      slug: "copilot",
      category: "Enterprise Pair Programmer",
      matchScore: 96.8,
      pricing: "$19/user/mo Business",
      pricingType: "paid",
      why: "Seamless SOC2 compliance, centralized org seat management, and GitHub repo integration.",
      runnerUp: { name: "Cursor", slug: "cursor" },
      compareSlug: "cursor-vs-copilot",
    },
  },
  writing: {
    free: {
      name: "Grammarly AI",
      slug: "grammarly",
      category: "Grammar & Tone Assistant",
      matchScore: 96.2,
      pricing: "Free basic tier available",
      pricingType: "free",
      why: "Reliable context-aware tone analysis and real-time sentence restructuring.",
      runnerUp: { name: "Perplexity", slug: "perplexity" },
      compareSlug: "jasper-vs-writesonic",
    },
    benchmark: {
      name: "Perplexity",
      slug: "perplexity",
      category: "Answer Engine & Synthesis",
      matchScore: 98.9,
      pricing: "Free basic · $20/mo Pro",
      pricingType: "freemium",
      why: "Live web citation verification, academic paper indexing, and Deep Research agents.",
      runnerUp: { name: "Jasper", slug: "jasper" },
      compareSlug: "jasper-vs-writesonic",
    },
    budget: {
      name: "Writesonic",
      slug: "writesonic",
      category: "Content & SEO Generator",
      matchScore: 95.8,
      pricing: "$16/mo Individual plan",
      pricingType: "paid",
      why: "Built-in Google SERP competitive research and programmatic article builder.",
      runnerUp: { name: "Jasper", slug: "jasper" },
      compareSlug: "jasper-vs-writesonic",
    },
    team: {
      name: "Jasper",
      slug: "jasper",
      category: "Enterprise Brand Copy Engine",
      matchScore: 97.1,
      pricing: "$49/mo Creator / Team tiers",
      pricingType: "paid",
      why: "Company voice knowledge bases and custom multi-channel campaign orchestration.",
      runnerUp: { name: "Writesonic", slug: "writesonic" },
      compareSlug: "jasper-vs-writesonic",
    },
  },
  speed: {
    free: {
      name: "OpenRouter",
      slug: "openrouter",
      category: "Unified Model API Gateway",
      matchScore: 97.9,
      pricing: "Pay-as-you-go + Free models",
      pricingType: "free",
      why: "Access 100+ open-source and proprietary models with 0 monthly subscription overhead.",
      runnerUp: { name: "Groq", slug: "groq" },
      compareSlug: "groq-vs-openrouter",
    },
    benchmark: {
      name: "Groq",
      slug: "groq",
      category: "LPU Ultra-Fast Inference",
      matchScore: 99.4,
      pricing: "Free playground · Pay-per-token",
      pricingType: "freemium",
      why: "Up to 500+ tokens/sec on Llama 3 models via custom Tensor Streaming LPU silicon.",
      runnerUp: { name: "OpenRouter", slug: "openrouter" },
      compareSlug: "groq-vs-openrouter",
    },
    budget: {
      name: "Groq",
      slug: "groq",
      category: "Cost-Effective Inference",
      matchScore: 98.2,
      pricing: "Under $0.08 per 1M tokens",
      pricingType: "freemium",
      why: "The lowest latency-per-dollar ratio available for real-time customer voice and chatbots.",
      runnerUp: { name: "OpenRouter", slug: "openrouter" },
      compareSlug: "groq-vs-openrouter",
    },
    team: {
      name: "OpenRouter",
      slug: "openrouter",
      category: "Model Routing & Fallbacks",
      matchScore: 96.5,
      pricing: "Team pooled balances",
      pricingType: "paid",
      why: "Unified key management with automatic fallback routing if an upstream provider fails.",
      runnerUp: { name: "Groq", slug: "groq" },
      compareSlug: "groq-vs-openrouter",
    },
  },
  analytics: {
    free: {
      name: "Fathom Analytics",
      slug: "fathom",
      category: "Cookieless Web Analytics",
      matchScore: 96.0,
      pricing: "30-day unlimited trial",
      pricingType: "freemium",
      why: "No cookie banners required, 100% GDPR compliant, and instantaneous load times.",
      runnerUp: { name: "Mutiny", slug: "mutiny" },
      compareSlug: "fathom-vs-mutiny",
    },
    benchmark: {
      name: "Gong",
      slug: "gong",
      category: "Revenue & Sales Intelligence",
      matchScore: 98.5,
      pricing: "Custom enterprise pricing",
      pricingType: "paid",
      why: "Customer interaction analysis predicting deal health and customer churn risks.",
      runnerUp: { name: "Otter.ai", slug: "otter" },
      compareSlug: "gong-vs-otter",
    },
    budget: {
      name: "Fathom Analytics",
      slug: "fathom",
      category: "Privacy-First Analytics",
      matchScore: 97.4,
      pricing: "$15/mo up to 100k views",
      pricingType: "paid",
      why: "Transparent flat pricing with zero data resale or third-party behavioral profiling.",
      runnerUp: { name: "Mutiny", slug: "mutiny" },
      compareSlug: "fathom-vs-mutiny",
    },
    team: {
      name: "Gong",
      slug: "gong",
      category: "Revenue Intelligence Platform",
      matchScore: 98.0,
      pricing: "Enterprise per-seat contract",
      pricingType: "paid",
      why: "Centralizes sales team call transcripts and CRM deal progression alerts.",
      runnerUp: { name: "Otter.ai", slug: "otter" },
      compareSlug: "gong-vs-otter",
    },
  },
  marketing: {
    free: {
      name: "AdCreative.ai",
      slug: "adcreative",
      category: "Conversion Ad Generator",
      matchScore: 95.7,
      pricing: "Free 7-day trial with credits",
      pricingType: "freemium",
      why: "Trained on hundreds of thousands of top-performing ad creatives and conversion hooks.",
      runnerUp: { name: "Surfer SEO", slug: "surfer" },
      compareSlug: "adcreative-vs-surfer",
    },
    benchmark: {
      name: "Surfer SEO",
      slug: "surfer",
      category: "Content Optimization Engine",
      matchScore: 98.7,
      pricing: "$89/mo Essential tier",
      pricingType: "paid",
      why: "Live NLP audit of SERP page-one competitors with exact keyword frequency scoring.",
      runnerUp: { name: "AdCreative.ai", slug: "adcreative" },
      compareSlug: "adcreative-vs-surfer",
    },
    budget: {
      name: "AdCreative.ai",
      slug: "adcreative",
      category: "High-ROI Creative Asset AI",
      matchScore: 96.5,
      pricing: "$29/mo Starter plan",
      pricingType: "freemium",
      why: "Generate 50+ localized display banner variations in under 60 seconds.",
      runnerUp: { name: "Surfer SEO", slug: "surfer" },
      compareSlug: "adcreative-vs-surfer",
    },
    team: {
      name: "Mutiny",
      slug: "mutiny",
      category: "B2B Website Personalization",
      matchScore: 97.8,
      pricing: "Team & Growth plans",
      pricingType: "paid",
      why: "Automatically tailors landing page headlines by inbound visitor company and industry.",
      runnerUp: { name: "Surfer SEO", slug: "surfer" },
      compareSlug: "adcreative-vs-surfer",
    },
  },
};

const JOB_OPTIONS: { id: JobCategory; label: string; icon: string }[] = [
  { id: "code", label: "Coding & Dev", icon: "💻" },
  { id: "writing", label: "Writing & SEO", icon: "✍️" },
  { id: "speed", label: "Fast LLM APIs", icon: "⚡" },
  { id: "analytics", label: "Analytics & Sales", icon: "📊" },
  { id: "marketing", label: "Ads & Growth", icon: "🎯" },
];

const CONSTRAINT_OPTIONS: { id: Constraint; label: string }[] = [
  { id: "benchmark", label: "⚡ Best Benchmark" },
  { id: "free", label: "🆓 Free / Freemium" },
  { id: "budget", label: "💰 Under $20/mo" },
  { id: "team", label: "🏢 Team / Enterprise" },
];

export function HeroMatcherSlot() {
  const [selectedJob, setSelectedJob] = useState<JobCategory>("code");
  const [selectedConstraint, setSelectedConstraint] = useState<Constraint>("benchmark");
  const [isRolling, setIsRolling] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(99.2);
  const [, startTransition] = useTransition();

  const currentMatch = MATCH_DATABASE[selectedJob][selectedConstraint];

  const handleSelectJob = (job: JobCategory) => {
    if (job === selectedJob) return;
    triggerRoll(() => setSelectedJob(job));
  };

  const handleSelectConstraint = (constraint: Constraint) => {
    if (constraint === selectedConstraint) return;
    triggerRoll(() => setSelectedConstraint(constraint));
  };

  const triggerRoll = (updater: () => void) => {
    setIsRolling(true);
    updater();

    // Trigger snappy match score counter effect
    const nextMatch = MATCH_DATABASE[selectedJob][selectedConstraint];
    const target = nextMatch?.matchScore ?? 98.4;
    
    // Quick tick
    let current = Math.max(90, target - 5);
    const interval = setInterval(() => {
      current += 0.8;
      if (current >= target) {
        setDisplayedScore(target);
        clearInterval(interval);
      } else {
        setDisplayedScore(parseFloat(current.toFixed(1)));
      }
    }, 30);

    setTimeout(() => {
      setIsRolling(false);
    }, 280);
  };

  useEffect(() => {
    setDisplayedScore(currentMatch.matchScore);
  }, [currentMatch]);

  return (
    <div
      className="relative w-full max-w-xl mx-auto lg:max-w-none rounded-2xl border border-white/10 bg-surface-1/90 p-5 sm:p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all"
      role="region"
      aria-label="Instant AI Tool Matcher"
    >
      {/* Subtle top edge gradient illumination */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        aria-hidden="true"
      />

      {/* Header bar with live status */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Live Tool Matcher · Instant Slot
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          <span>Zero Sponsor Bias</span>
        </span>
      </div>

      {/* Step 1: Select Job */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-foreground mb-2">
          1. What is your primary objective?
        </label>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {JOB_OPTIONS.map((item) => {
            const active = selectedJob === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectJob(item.id)}
                className={`group inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "border border-primary/50 bg-primary/20 text-white shadow-[0_0_15px_-3px_rgba(112,34,252,0.5)] ring-1 ring-primary/40"
                    : "border border-white/10 bg-surface-2/60 text-muted-foreground hover:border-white/20 hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Constraint */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-foreground mb-2">
          2. What is your main priority?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {CONSTRAINT_OPTIONS.map((item) => {
            const active = selectedConstraint === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectConstraint(item.id)}
                className={`rounded-xl px-2 py-1.5 text-center text-xs font-medium transition-all ${
                  active
                    ? "border border-accent/50 bg-accent/15 text-accent shadow-[0_0_12px_-2px_rgba(253,143,50,0.3)] ring-1 ring-accent/30"
                    : "border border-white/10 bg-surface-2/60 text-muted-foreground hover:border-white/20 hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Slot Display */}
      <div
        className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-surface-2/90 to-surface-1/90 p-4 transition-all duration-300 ${
          isRolling ? "opacity-60 scale-[0.99] blur-[1px]" : "opacity-100 scale-100 blur-0"
        }`}
      >
        {/* Match Header Badge & Score */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            <Zap className="h-3 w-3 fill-emerald-400 text-emerald-400" />
            <span>Top Match</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-foreground">
            <span className="text-muted-foreground">Compatibility:</span>
            <span className="font-semibold text-primary-content bg-primary/20 px-2 py-0.5 rounded-md border border-primary/30">
              {displayedScore.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Tool Info */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div>
            <h4 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
              <span>{currentMatch.name}</span>
              <span className="rounded-md bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
                {currentMatch.category}
              </span>
            </h4>
            <p className="text-xs text-subtle-foreground mt-0.5 font-mono">
              {currentMatch.pricing}
            </p>
          </div>
        </div>

        {/* Reason for Match */}
        <div className="rounded-lg bg-surface-1/80 border border-white/[0.06] p-2.5 mb-4 text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Why it matches: </span>
          {currentMatch.why}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Link
            href={`/tools/${currentMatch.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <span>Explore {currentMatch.name}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {currentMatch.compareSlug && (
            <Link
              href={`/compare/${currentMatch.compareSlug}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-surface-1 px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
              title={`Compare ${currentMatch.name} vs ${currentMatch.runnerUp.name}`}
            >
              <Scale className="h-3.5 w-3.5 text-accent" />
              <span>Vs {currentMatch.runnerUp.name}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Footer Guarantee / Micro-link */}
      <div className="mt-3.5 flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>Audited specs & verified pricing</span>
        <Link
          href="/categories"
          className="hover:text-foreground text-primary-content transition-colors flex items-center gap-1"
        >
          <span>Browse 40+ categories</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
