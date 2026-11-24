"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  Code2,
  Copy,
  CornerDownLeft,
  GitCompareArrows,
  Globe,
  Megaphone,
  PenLine,
  Search,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { HeroCanvas } from "@/components/animations/hero-canvas";
import { HeroMatcherSlot } from "@/components/home/hero-matcher-slot";
import { Magnet } from "@/components/bits/magnet";
import { SplitText } from "@/components/bits/split-text";
import { SpotlightPanel } from "@/components/bits/spotlight-panel";
import { CategoryCard } from "@/components/tool/category-card";
import { CategoryExplorer } from "@/components/category/category-explorer";
import { ToolCard, type ToolCardData } from "@/components/tool/tool-card";
import { ToolLogo } from "@/components/tool/tool-logo";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const trendingShowcaseTools: ToolCardData[] = [
  {
    id: "cursor-ai",
    name: "Cursor",
    slug: "cursor",
    tagline: "AI-first code editor built for pair programming and deep codebase understanding.",
    category: "Developer Tools",
    categorySlug: "developer-tools",
    pricingModel: "freemium",
    startingPrice: "$20/mo",
    websiteUrl: "https://cursor.com",
    score: 94,
    isVerified: true,
    upvotes: 184,
    bestFor: "Engineers replacing VS Code + GitHub Copilot with full-repo context",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    slug: "claude-code",
    tagline: "Agentic command-line tool that writes code, runs terminal workflows, and edits files.",
    category: "Developer Tools",
    categorySlug: "developer-tools",
    pricingModel: "usage_based",
    startingPrice: "API usage",
    websiteUrl: "https://claude.ai/code",
    score: 93,
    isVerified: true,
    upvotes: 142,
    bestFor: "Terminal power users who want autonomous agents editing files locally",
  },
];

const recentlyAddedTools: ToolCardData[] = [
  {
    id: "perplexity-ai",
    name: "Perplexity AI",
    slug: "perplexity",
    tagline: "Conversational answer engine with direct citation verification and multi-model access.",
    category: "Productivity",
    categorySlug: "productivity",
    pricingModel: "freemium",
    startingPrice: "$20/mo",
    websiteUrl: "https://perplexity.ai",
    score: 91,
    isVerified: true,
    upvotes: 119,
    bestFor: "Researchers needing instant citations and multi-LLM answer synthesis",
  },
  {
    id: "v0-vercel",
    name: "v0 by Vercel",
    slug: "v0",
    tagline: "Generative UI system that turns natural language briefs into React Tailwind components.",
    category: "Developer Tools",
    categorySlug: "developer-tools",
    pricingModel: "freemium",
    startingPrice: "$20/mo",
    websiteUrl: "https://v0.dev",
    score: 90,
    isVerified: true,
    upvotes: 98,
    bestFor: "Designers & frontend devs scaffolding production React Tailwind components",
  },
];

const workflowSteps = [
  {
    index: "01",
    title: "Specify your task & constraints",
    body: "Define the exact workflow, tech stack, and budget caps that actually decide your software shortlist.",
  },
  {
    index: "02",
    title: "Audit real SaaS pricing & quotas",
    body: "Compare published tier costs, token limits, and verified API capabilities side-by-side with zero paywalled guesswork.",
  },
  {
    index: "03",
    title: "Deploy with zero sponsor bias",
    body: "Filter through verified community upvotes and independent intelligence scores before committing company budget.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Magnet strength={0.22}>
      <Link
        href={href}
        prefetch={false}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface-1/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {children}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </Magnet>
  );
}

interface ScenarioPreset {
  id: string;
  label: string;
  task: string;
  budget: string;
  mustHaves: string;
  recommended: string;
  exploreHref: string;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "mvp",
    label: "Solo Founder MVP",
    task: "Build and deploy production-grade React UI in 48 hours",
    budget: "Free tier or < $25/mo",
    mustHaves: "Next.js + Tailwind + fast zero-setup prototyping",
    recommended: "v0 by Vercel + Cursor",
    exploreHref: "/explore?q=developer-tools",
  },
  {
    id: "seo",
    label: "SEO Content Machine",
    task: "Generate long-form articles grounded in real web citations",
    budget: "$20/mo Pro plan",
    mustHaves: "Direct source attribution & deep research synthesis",
    recommended: "Perplexity AI + Writesonic",
    exploreHref: "/explore?q=seo",
  },
  {
    id: "agent",
    label: "Autonomous CLI Agent",
    task: "Automate terminal workflows, git branches, and local repo edits",
    budget: "API usage-based",
    mustHaves: "Native command-line agent with local file execution",
    recommended: "Claude Code",
    exploreHref: "/explore?q=claude",
  },
];

export function HomeView() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<ScenarioPreset>(SCENARIO_PRESETS[0]);
  const [copiedCli, setCopiedCli] = useState(false);

  const handleCopyCli = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      navigator.clipboard.writeText("npx aitoolsfinder-submit");
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/explore?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/explore");
    }
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-hero-item]", {
        y: 22,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.7,
        delay: 0.2,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
      });

      // Gentle scroll parallax without dimming text opacity
      const heroTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
        },
      });

      heroTimeline
        .to("#home-title", {
          y: -25,
          ease: "none",
        }, 0)
        .to("[data-hero-desc]", {
          y: -18,
          ease: "none",
        }, 0)
        .to("[data-hero-search]", {
          y: -12,
          ease: "none",
        }, 0);

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 32,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 86%",
          },
          clearProps: "transform,opacity,visibility",
        });
      });

      const line = root.querySelector<HTMLElement>("[data-progress]");
      if (line) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: "[data-workflow]",
              start: "top 70%",
              end: "bottom 55%",
              scrub: 0.65,
            },
          },
        );
      }

      gsap.utils.toArray<HTMLElement>("[data-step]").forEach((step, index) => {
        gsap.from(step, {
          y: 40,
          autoAlpha: 0,
          duration: 0.7,
          delay: index * 0.02,
          ease: "power3.out",
          scrollTrigger: {
            trigger: step,
            start: "top 82%",
          },
          clearProps: "transform,opacity,visibility",
        });
      });
    });

    mm.add(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      () => {
        const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
        steps.forEach((step) => {
          gsap.to(step, {
            borderColor: "rgba(196, 163, 253, 0.72)",
            scrollTrigger: {
              trigger: step,
              start: "top 62%",
              end: "bottom 48%",
              toggleActions: "play reverse play reverse",
            },
          });
        });
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        <section
          data-hero
          aria-labelledby="home-title"
          className="relative isolate overflow-hidden"
        >
          <HeroCanvas />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/25" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

          <div className="relative z-10 mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-10 sm:gap-14 px-4 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.8fr)] lg:px-8">
            <div className="max-w-2xl">
              <div data-hero-item className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface-2/95 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                  Verified AI & SaaS Directory · 1,200+ Tools
                </span>
                <Link
                  href="/submit"
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 text-xs text-primary-content hover:text-white transition-colors group"
                >
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent group-hover:bg-accent group-hover:text-black transition-colors">
                    Free Backlink
                  </span>
                  <span>Built an AI SaaS? List it free</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <button
                  type="button"
                  onClick={handleCopyCli}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:border-accent hover:text-white transition-all backdrop-blur-md"
                  title="Click to copy terminal command to submit your tool"
                >
                  <Terminal className="h-3 w-3 text-accent" />
                  <span>npx aitoolsfinder-submit</span>
                  {copiedCli ? (
                    <span className="text-[10px] font-semibold text-accent font-sans">✓ Copied</span>
                  ) : (
                    <Copy className="h-2.5 w-2.5 text-zinc-400" />
                  )}
                </button>
              </div>
              <SplitText
                as="h1"
                id="home-title"
                text="Find the right AI tool & SaaS for your exact job."
                accent="job"
                className="max-w-[15ch] text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
              />
              <p data-hero-item data-hero-desc className="mt-6 max-w-xl text-base leading-relaxed text-zinc-200 font-normal sm:text-lg">
                Start with the exact task you need solved. Compare 1,200+ vetted AI tools and B2B SaaS platforms
                using audited plan pricing, verified capabilities, and zero sponsor bias.
              </p>

              <form
                data-hero-item
                data-hero-search
                onSubmit={handleSearchSubmit}
                role="search"
                className="mt-8 max-w-xl rounded-2xl border border-white/20 bg-[#0e0c15] p-1.5 sm:p-2 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30"
              >
                <label htmlFor="tool-query" className="sr-only">
                  Describe the work or SaaS you need
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 sm:px-3">
                    <Search aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-zinc-300" />
                    <input
                      id="tool-query"
                      name="q"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search 1,200+ AI tools, SaaS products, or workflows..."
                      className="h-11 min-w-0 flex-1 bg-transparent text-xs sm:text-sm text-white font-medium outline-none placeholder:text-zinc-400"
                    />
                  </div>
                  <Magnet strength={0.18} className="shrink-0">
                    <Button
                      type="submit"
                      size="sm"
                      className="h-10 px-3 sm:px-3.5 rounded-xl flex items-center gap-1.5 shrink-0 font-medium"
                      aria-label="Submit search"
                      title="Press Enter to search"
                    >
                      <span className="text-xs font-mono hidden sm:inline-block">Enter</span>
                      <CornerDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </Magnet>
                </div>
              </form>

              {/* 1-Tap Search Shortcut Pills */}
              <div data-hero-item data-hero-tags className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-300 font-medium mr-1">Popular:</span>
                {[
                  { label: "B2B SaaS", href: "/explore?q=saas" },
                  { label: "Coding Copilots", href: "/explore?q=coding" },
                  { label: "SEO & Content", href: "/explore?q=seo" },
                  { label: "Free Backlink", href: "/submit", highlight: true },
                  { label: "Marketing AI", href: "/explore?q=marketing" },
                  { label: "Free Tier", href: "/explore?q=free" },
                ].map((pill) => (
                  <Link
                    key={pill.label}
                    href={pill.href}
                    prefetch={false}
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      pill.highlight
                        ? "border-accent/50 bg-accent/20 text-accent font-semibold hover:bg-accent/30"
                        : "border-white/15 bg-surface-2 text-zinc-200 hover:border-primary/50 hover:bg-surface-3 hover:text-white"
                    }`}
                  >
                    {pill.label}
                  </Link>
                ))}
              </div>

              <div data-hero-item className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-zinc-200">
                <span className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary-content" />
                  40+ Curated SaaS categories
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary-content" />
                  Audited plan pricing (No hidden fees)
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
                  Free high-authority backlink for SaaS builders
                </span>
              </div>
            </div>

            <div data-hero-item className="relative w-full flex items-center justify-center pt-6 lg:pt-0">
              <HeroMatcherSlot />
            </div>
          </div>
        </section>

        {/* Live Trust & Social Proof Activity Ticker */}
        <section
          aria-label="Platform activity and trust stats"
          className="border-y border-white/10 bg-surface-1/60 py-3.5 backdrop-blur-md overflow-hidden relative"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-6 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold text-white">Live Index:</span>
                <span>1,240+ tool capabilities audited this month</span>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-accent font-bold">⚡</span>
                <span><strong className="text-white font-medium">310+ developers</strong> added tools to My Stack today</span>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <span className="text-primary-content font-bold">🛡️</span>
                <span><strong className="text-white font-medium">$0 pay-to-rank bias</strong> · 100% verified test data</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-accent font-bold">🚀</span>
                <Link href="/submit" prefetch={false} className="text-accent hover:underline font-semibold inline-flex items-center gap-1">
                  <span>List your AI SaaS free (Earn Backlink)</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          data-workflow
          aria-labelledby="workflow-title"
          className="relative px-4 py-14 sm:py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div data-reveal className="lg:sticky lg:top-28">
              <SectionHeading
                id="workflow-title"
                eyebrow="The Workflow"
                title="From workflow bottleneck to verified SaaS shortlist"
                description="Evidence over marketing claims. Every recommendation is grounded in audited pricing and verified capability proofs."
              />
              <div className="relative mt-10 hidden h-32 w-32 lg:block" aria-hidden="true">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-xl" />
                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-orange-glow" />
              </div>
            </div>

            <div className="relative pl-2">
              <div
                data-progress
                className="absolute bottom-6 left-[1.35rem] top-6 w-px origin-top bg-gradient-to-b from-primary-content via-accent to-transparent"
                aria-hidden="true"
              />
              <ol className="space-y-5">
                {workflowSteps.map((step) => (
                  <li
                    key={step.index}
                    data-step
                    className="relative ml-8 rounded-3xl border border-white/10 bg-surface-1/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-8"
                  >
                    <span className="absolute -left-[2.55rem] top-8 flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-background font-mono text-[10px] text-primary-content">
                      {step.index}
                    </span>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="categories-title"
          className="bg-surface-1/40 px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div data-reveal>
              <SectionHeading
                id="categories-title"
                eyebrow="Directory Taxonomy · 40+ Curated Categories"
                title="Browse by the kind of work"
                description="Search across 40+ verified software categories or filter by workflow to find specialized tools for your exact task."
              />
            </div>
            <div data-reveal className="mt-8 sm:mt-10">
              <CategoryExplorer initialExpanded={false} featuredLimit={6} />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="trending-title"
          className="px-4 py-12 sm:py-20 sm:px-6 lg:px-8 relative overflow-hidden"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div data-reveal>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                Live Cohort · Today&apos;s Verified Drops
              </div>
              <SectionHeading
                id="trending-title"
                eyebrow="Community Leaderboard"
                title="Vote, shortlist, and track what builders actually use"
                description="Vote for newly verified tools to help surface reliable AI software. Add your favorites to My Stack to get alerted on price adjustments."
              />
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <SectionLink href="/explore">Browse All Cohorts</SectionLink>
              </div>
            </div>
            <div data-reveal className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trendingShowcaseTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}

              {/* Founder Trap Card (Native Submission Hook) */}
              <div className="sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4 sm:p-5 transition-all hover:border-primary/80 hover:bg-primary/10">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/20 text-primary-content">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Built an AI tool or SaaS?
                      </h3>
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        Free Dofollow Link
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xl">
                      Get listed on today&apos;s leaderboard in front of 50,000+ monthly buyers. Submit in 1 click via terminal or web form.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyCli}
                    className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-black/80 px-3 py-2 font-mono text-xs text-accent hover:border-accent hover:bg-black transition-all shadow-inner"
                    title="Click to copy terminal command"
                  >
                    <span className="text-zinc-400 select-none font-bold">$</span>
                    <span className="font-semibold text-white">npx aitoolsfinder-submit</span>
                    {copiedCli ? (
                      <span className="flex items-center gap-1 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent font-sans font-bold">
                        <CheckCheck className="h-3 w-3" /> Copied!
                      </span>
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                  </button>
                  <Link
                    href="/submit"
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover"
                  >
                    <span>Or Form</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="rankings-title"
          className="bg-surface-1/40 px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div data-reveal>
              <SectionHeading
                id="rankings-title"
                eyebrow="Curated rankings"
                title="Rankings that show their work"
                description="A useful ranking needs clear criteria and evidence behind each placement. The method sits next to the list."
              />
              <div className="mt-7">
                <SectionLink href="/rankings">View rankings</SectionLink>
              </div>
            </div>
            <SpotlightPanel className="rounded-3xl border border-white/10 bg-background p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle-foreground">
                Ranking criteria
              </p>
              <div className="mt-5 divide-y divide-border/70">
                {[
                  { rank: "#1", name: "Cursor", score: "94.2", slug: "cursor", cat: "Developer Tools", websiteUrl: "https://cursor.com" },
                  { rank: "#2", name: "Claude Code", score: "92.8", slug: "claude-code", cat: "Developer Tools", websiteUrl: "https://claude.ai/code" },
                  { rank: "#3", name: "Perplexity AI", score: "90.5", slug: "perplexity", cat: "Productivity", websiteUrl: "https://perplexity.ai" },
                ].map((item) => (
                  <div
                    key={item.slug}
                    className="flex items-center justify-between py-3.5 group hover:bg-surface-2/40 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-accent shrink-0">{item.rank}</span>
                      <a
                        href={item.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 transition-transform group-hover:scale-105"
                        title={`Directly open official ${item.name} website`}
                      >
                        <ToolLogo slug={item.slug} name={item.name} size="sm" websiteUrl={item.websiteUrl} />
                      </a>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/tools/${item.slug}`}
                            className="text-sm font-semibold text-foreground hover:text-primary-content transition-colors truncate"
                          >
                            {item.name}
                          </Link>
                          <a
                            href={item.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-accent hover:underline"
                            title={`Open official ${item.name} website`}
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        </div>
                        <span className="text-xs text-muted-foreground block truncate">{item.cat}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-semibold text-foreground">{item.score}</span>
                      <span className="text-[11px] text-muted-foreground"> / 100</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="border-t border-border pt-4 text-xs leading-relaxed text-subtle-foreground">
                Rankings are calculated dynamically from published benchmark records and pricing verification.
              </p>
            </SpotlightPanel>
          </div>
        </section>

        <section
          aria-labelledby="comparisons-title"
          className="px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div data-reveal>
              <SectionHeading
                id="comparisons-title"
                eyebrow="Popular comparisons"
                title="Compare the details that change a decision"
                description="Line up features and pricing side by side when you have two candidates in mind."
              />
              <div className="mt-7">
                <SectionLink href="/compare">Open comparisons</SectionLink>
              </div>
            </div>
            <SpotlightPanel className="rounded-3xl border border-white/10 bg-surface-1 p-5 sm:p-7">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex min-h-28 flex-col justify-between rounded-2xl border border-border bg-background p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-primary-content">Cursor</span>
                    <a
                      href="https://cursor.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80"
                      title="Visit cursor.com"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <ToolLogo slug="cursor" name="Cursor" size="sm" websiteUrl="https://cursor.com" />
                    <div>
                      <Link href="/tools/cursor" className="text-sm font-semibold text-foreground hover:underline">
                        AI Code Editor
                      </Link>
                      <span className="block text-xs text-muted-foreground">Freemium · $20/mo</span>
                    </div>
                  </div>
                </div>
                <GitCompareArrows aria-hidden="true" className="h-5 w-5 text-accent" />
                <div className="flex min-h-28 flex-col justify-between rounded-2xl border border-border bg-background p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-accent">Claude Code</span>
                    <a
                      href="https://claude.ai/code"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80"
                      title="Visit claude.ai/code"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <ToolLogo slug="claude-code" name="Claude Code" size="sm" websiteUrl="https://claude.ai/code" />
                    <div>
                      <Link href="/tools/claude-code" className="text-sm font-semibold text-foreground hover:underline">
                        Agentic CLI Assistant
                      </Link>
                      <span className="block text-xs text-muted-foreground">Usage-based</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-subtle-foreground">
                  Side-by-side feature matrix & API limits
                </span>
                <Link href="/compare/preview?tool=cursor&tool=claude-code">
                  <Button variant="secondary" size="sm">
                    Compare Cursor vs Claude Code <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* Versus Arena Quick Matchup Chips */}
              <div className="mt-4 border-t border-border/60 pt-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <span className="text-accent font-bold">⚔️</span>
                  <span>Trending Head-to-Head Matchups</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Cursor vs Windsurf", href: "/compare/preview?tool=cursor&tool=windsurf" },
                    { label: "v0 vs Lovable", href: "/compare/preview?tool=v0&tool=lovable" },
                    { label: "ChatGPT vs Claude", href: "/compare/preview?tool=chatgpt&tool=claude" },
                    { label: "Perplexity vs Gemini", href: "/compare/preview?tool=perplexity&tool=gemini" },
                  ].map((matchup) => (
                    <Link
                      key={matchup.label}
                      href={matchup.href}
                      prefetch={false}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background/80 px-2.5 py-1 text-xs text-zinc-300 hover:border-primary/50 hover:bg-surface-2 hover:text-white transition-colors"
                    >
                      <span className="text-[9px] font-bold text-accent font-mono">VS</span>
                      <span>{matchup.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </SpotlightPanel>
          </div>
        </section>

        <section
          aria-labelledby="finder-title"
          className="bg-surface-1/40 px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div data-reveal>
              <SectionHeading
                id="finder-title"
                eyebrow="AI Finder"
                title="Describe the job. Keep your constraints."
                description="A guided shortlist can start from what you need to do, your budget, and the features you can't work without."
              />
              <div className="mt-7">
                <SectionLink href="/ai-finder">Explore AI Finder</SectionLink>
              </div>
            </div>
            <SpotlightPanel className="rounded-3xl border border-white/10 bg-background p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles aria-hidden="true" className="h-4 w-4 text-accent" />
                  <span>Interactive Scenario Matcher</span>
                </div>
                <span className="text-[11px] font-mono text-accent bg-accent/15 px-2 py-0.5 rounded-full font-semibold">
                  1-Click Presets
                </span>
              </div>

              {/* Preset Selector Chips */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {SCENARIO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      selectedPreset.id === preset.id
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground border border-border/70"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-primary/20 bg-surface-1/90 p-4 transition-all">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-content">The Task</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{selectedPreset.task}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-surface-1 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">Budget</p>
                    <p className="mt-1 text-xs font-medium text-foreground">{selectedPreset.budget}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface-1 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">Must-haves</p>
                    <p className="mt-1 text-xs font-medium text-foreground">{selectedPreset.mustHaves}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-muted-foreground block text-[11px]">Top recommended stack:</span>
                  <span className="font-semibold text-accent font-mono">{selectedPreset.recommended}</span>
                </div>
                <Link href={selectedPreset.exploreHref} prefetch={false}>
                  <Button size="sm" className="w-full sm:w-auto text-xs font-semibold">
                    Find Tools for This Job <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </SpotlightPanel>
          </div>
        </section>

        <section
          aria-labelledby="recent-title"
          className="px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div data-reveal>
              <SectionHeading
                id="recent-title"
                eyebrow="Recently added"
                title="New tools, with their details intact"
                description="New listings should be easy to scan and easy to verify."
              />
            </div>
            <div data-reveal className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentlyAddedTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="editorial-title"
          className="bg-surface-1/40 px-4 py-14 sm:py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div data-reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
                Editorial
              </p>
              <h2 id="editorial-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Start with the work, not the hype.
              </h2>
            </div>
            <div data-reveal className="max-w-3xl border-l-2 border-primary/70 pl-6 sm:pl-8">
              <p className="text-xl leading-relaxed text-foreground sm:text-2xl">
                Name the task. Decide what a good result looks like. Then check whether a tool&apos;s features,
                limits, and price fit the way you work.
              </p>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Guides focus on practical fit and clearly sourced product details, so you can make
                a shortlist for your own needs.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="vendor-title" className="px-4 py-12 sm:py-20 sm:px-6 lg:px-8">
          <SpotlightPanel className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-primary/40 bg-gradient-to-b from-surface-1 via-surface-1/90 to-surface-2 p-8 sm:p-12 lg:p-16 shadow-[0_24px_80px_-24px_rgba(112,34,252,0.25)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />

            <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-semibold text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  For SaaS Founders & Builders
                </div>
                <h2 id="vendor-title" className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Built an AI SaaS? Get 50,000+ buyers and a <span className="text-accent underline decoration-accent/40 underline-offset-4">free backlink</span>.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  List your software in our curated directory in 90 seconds. Earn a permanent, high-authority dofollow
                  backlink to boost your SEO, rank in AI answer engines (AEO), and drive high-intent SaaS buyers directly to your app.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-background/50 p-4 backdrop-blur-sm">
                    <Check className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Permanent Free Backlink</p>
                      <p className="text-xs text-muted-foreground mt-0.5">High-authority dofollow link to accelerate your domain rating & SEO.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-background/50 p-4 backdrop-blur-sm">
                    <Check className="h-5 w-5 shrink-0 text-primary-content mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">High-Intent SaaS Buyers</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Get shortlisted by teams actively comparing and replacing tools.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-background/50 p-4 backdrop-blur-sm">
                    <Check className="h-5 w-5 shrink-0 text-primary-content mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">100% Free Organic Listing</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Zero hidden fees or forced paywalls. Transparent editorial audit.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-background/50 p-4 backdrop-blur-sm">
                    <Check className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">AI Search Indexing (AEO)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Structured for citation by Perplexity, ChatGPT, and Claude.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-3xl border border-white/15 bg-[#09080e]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
                {/* Terminal Window Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-green-500/80 inline-block" />
                    <span className="ml-2 font-mono text-[11px] text-zinc-400">~/my-ai-startup — bash</span>
                  </div>
                  <span className="rounded-full bg-accent/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                    5-Second Claim
                  </span>
                </div>

                {/* Terminal Content */}
                <div className="py-4 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Vibe Coder &amp; Developer Fast-Lane
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Building in Cursor, Claude Code, or terminal? Don&apos;t waste time with manual web forms. Run this single command in your project directory:
                    </p>
                  </div>

                  {/* Copyable Terminal Command Bar */}
                  <div className="group relative flex items-center justify-between rounded-xl border border-accent/40 bg-black/90 p-3 shadow-inner">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none font-mono text-xs sm:text-sm">
                      <span className="text-accent font-bold select-none">$</span>
                      <code className="text-white font-semibold tracking-wide">
                        npx aitoolsfinder-submit
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCli}
                      className="ml-2 shrink-0 flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-black transition-all shadow-sm"
                      title="Copy command to clipboard"
                    >
                      {copiedCli ? (
                        <>
                          <CheckCheck className="h-3.5 w-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Terminal Simulated Telemetry */}
                  <div className="space-y-1.5 rounded-xl border border-white/5 bg-surface-2/60 p-3 font-mono text-[11px] text-zinc-300">
                    <p className="flex items-center gap-2 text-zinc-400">
                      <span className="text-primary-content">➜</span>
                      <span>Auto-detects title, tagline &amp; git origin</span>
                    </p>
                    <p className="flex items-center gap-2 text-emerald-400">
                      <span>✓</span>
                      <span>Instant permanent dofollow backlink secured</span>
                    </p>
                    <p className="flex items-center gap-2 text-emerald-400">
                      <span>✓</span>
                      <span>Verified trust badge embedded in README</span>
                    </p>
                  </div>
                </div>

                {/* Alternative Web Form Link */}
                <div className="mt-2 border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Prefer standard browser form?</span>
                  <Link
                    href="/submit"
                    prefetch={false}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-content hover:text-white transition-colors"
                  >
                    <span>Submit via Web Browser</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </SpotlightPanel>
        </section>
      </main>

      <Footer />
    </div>
  );
}
