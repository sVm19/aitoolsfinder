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
  Code2,
  CornerDownLeft,
  GitCompareArrows,
  Globe,
  Megaphone,
  PenLine,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { HeroCanvas } from "@/components/animations/hero-canvas";
import { heroMotion } from "@/components/animations/hero-motion";
import { Magnet } from "@/components/bits/magnet";
import { Marquee } from "@/components/bits/marquee";
import { SplitText } from "@/components/bits/split-text";
import { SpotlightPanel } from "@/components/bits/spotlight-panel";
import { CategoryCard } from "@/components/tool/category-card";
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

const categoryShortcuts = [
  {
    name: "Developer Tools",
    slug: "developer-tools",
    icon: <Code2 aria-hidden="true" className="h-5 w-5" />,
    description: "Code editors, terminal agents, testing automation, and repository copilots.",
    toolCount: 38,
    popularTools: [
      { name: "Cursor", slug: "cursor" },
      { name: "Claude Code", slug: "claude-code" },
      { name: "v0", slug: "v0" },
      { name: "Copilot", slug: "copilot" },
    ],
  },
  {
    name: "Productivity",
    slug: "productivity",
    icon: <Workflow aria-hidden="true" className="h-5 w-5" />,
    description: "Workflow orchestration, task managers, meeting summarizers, and workspace agents.",
    toolCount: 42,
    popularTools: [
      { name: "Perplexity", slug: "perplexity" },
      { name: "Notion AI", slug: "notion-ai" },
      { name: "Raycast", slug: "raycast" },
      { name: "Otter", slug: "otter" },
    ],
  },
  {
    name: "Marketing",
    slug: "marketing",
    icon: <Megaphone aria-hidden="true" className="h-5 w-5" />,
    description: "Ad creative generators, audience analytics, campaign copy, and conversion rate tools.",
    toolCount: 29,
    popularTools: [
      { name: "AdCreative", slug: "adcreative" },
      { name: "Jasper", slug: "jasper" },
      { name: "Mutiny", slug: "mutiny" },
    ],
  },
  {
    name: "Writing & SEO",
    slug: "writing",
    icon: <PenLine aria-hidden="true" className="h-5 w-5" />,
    description: "Long-form drafting, programmatic SEO engines, style editors, and tone refiners.",
    toolCount: 34,
    popularTools: [
      { name: "Grammarly", slug: "grammarly" },
      { name: "Writesonic", slug: "writesonic" },
      { name: "Surfer", slug: "surfer" },
    ],
  },
  {
    name: "AI & Models",
    slug: "ai",
    icon: <Sparkles aria-hidden="true" className="h-5 w-5" />,
    description: "LLM APIs, foundation models, multimodal inference engines, and fine-tuning platforms.",
    toolCount: 26,
    popularTools: [
      { name: "OpenRouter", slug: "openrouter" },
      { name: "Groq", slug: "groq" },
      { name: "Together AI", slug: "together-ai" },
    ],
  },
  {
    name: "Business & Sales",
    slug: "business",
    icon: <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />,
    description: "CRM intelligence, outbound automation, call transcription, and buyer intent analysis.",
    toolCount: 21,
    popularTools: [
      { name: "Gong", slug: "gong" },
      { name: "Fathom", slug: "fathom" },
      { name: "Apollo AI", slug: "apollo-io" },
    ],
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

export function HomeView() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

      ScrollTrigger.create({
        trigger: "[data-hero]",
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          heroMotion.progress = self.progress;
        },
      });

      // Cool GSAP ScrollTrigger parallax depth animation for the hero header section
      const heroTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom 20%",
          scrub: 0.5,
        },
      });

      heroTimeline
        .to("#home-title", {
          y: -40,
          opacity: 0.35,
          ease: "none",
        }, 0)
        .to("[data-hero-desc]", {
          y: -30,
          opacity: 0.3,
          ease: "none",
        }, 0)
        .to("[data-hero-search]", {
          y: -22,
          scale: 0.98,
          opacity: 0.8,
          ease: "none",
        }, 0)
        .to("[data-hero-tags]", {
          y: -14,
          opacity: 0.6,
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
          className="relative isolate overflow-hidden border-b border-border/60"
        >
          <HeroCanvas />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/25" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

          <div className="relative z-10 mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-10 sm:gap-14 px-4 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.8fr)] lg:px-8">
            <div className="max-w-2xl">
              <div data-hero-item className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface-1/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
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
              </div>
              <SplitText
                as="h1"
                id="home-title"
                text="Find the right AI tool & SaaS for your exact job."
                accent="job"
                className="max-w-[15ch] text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
              />
              <p data-hero-item data-hero-desc className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Start with the exact task you need solved. Compare 1,200+ vetted AI tools and B2B SaaS platforms
                using audited plan pricing, verified capabilities, and zero sponsor bias.
              </p>

              <form
                data-hero-item
                data-hero-search
                onSubmit={handleSearchSubmit}
                role="search"
                className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-surface-1/75 p-1.5 sm:p-2 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.7)] backdrop-blur-md transition-colors focus-within:border-primary/70"
              >
                <label htmlFor="tool-query" className="sr-only">
                  Describe the work or SaaS you need
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 sm:px-3">
                    <Search aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-muted-foreground" />
                    <input
                      id="tool-query"
                      name="q"
                      type="search"
                      required
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search 1,200+ AI tools, SaaS products, or workflows..."
                      className="h-11 min-w-0 flex-1 bg-transparent text-xs sm:text-sm text-foreground outline-none placeholder:text-subtle-foreground"
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
                <span className="text-xs text-subtle-foreground mr-1">Popular:</span>
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
                        ? "border-accent/40 bg-accent/15 text-accent font-medium hover:bg-accent/25"
                        : "border-border bg-surface-1/90 text-muted-foreground hover:border-primary/50 hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    {pill.label}
                  </Link>
                ))}
              </div>

              <div data-hero-item className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
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

            <div className="relative hidden min-h-[420px] lg:block" aria-hidden="true">
              {/* Space reserved for 3D Black Hole horizon interaction */}
            </div>
          </div>
        </section>

        <Marquee
          items={[
            "B2B SaaS",
            "Developer Tools",
            "AI Copilots",
            "Free Backlinks",
            "Verified Pricing",
            "Marketing SaaS",
            "Comparisons",
            "Agentic Workflows",
            "Productivity",
            "Autonomous Agents",
          ]}
        />

        <section
          data-workflow
          aria-labelledby="workflow-title"
          className="relative border-b border-border/60 px-4 py-14 sm:py-24 sm:px-6 lg:px-8"
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
          className="border-b border-border/60 bg-surface-1/40 px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div data-reveal>
              <SectionHeading
                id="categories-title"
                eyebrow="Start with a category"
                title="Browse by the kind of work"
                description="Use the directory taxonomy to narrow the space before comparing individual tools."
              />
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12">
              {categoryShortcuts.map((category, index) => (
                <div
                  key={category.slug}
                  data-reveal
                  className={index === 0 ? "md:col-span-7" : index === 1 ? "md:col-span-5" : "md:col-span-4"}
                >
                  <CategoryCard
                    name={category.name}
                    slug={category.slug}
                    icon={category.icon}
                    description={category.description}
                    toolCount={category.toolCount}
                    popularTools={category.popularTools}
                    className="h-full min-h-40"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="trending-title"
          className="border-b border-border/60 px-4 py-12 sm:py-20 sm:px-6 lg:px-8 relative overflow-hidden"
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
            </div>
          </div>
        </section>

        <section
          aria-labelledby="rankings-title"
          className="border-b border-border/60 bg-surface-1/40 px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
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
          className="border-b border-border/60 px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
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
            </SpotlightPanel>
          </div>
        </section>

        <section
          aria-labelledby="finder-title"
          className="border-b border-border/60 bg-surface-1/40 px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
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
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-accent" />
                Build a useful brief
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-border bg-surface-1 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-subtle-foreground">The task</p>
                  <p className="mt-2 text-sm text-muted-foreground">What do you want to get done?</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-surface-1 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-subtle-foreground">Budget</p>
                    <p className="mt-2 text-sm text-muted-foreground">Your price range</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface-1 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-subtle-foreground">Must-haves</p>
                    <p className="mt-2 text-sm text-muted-foreground">Features or limits</p>
                  </div>
                </div>
              </div>
            </SpotlightPanel>
          </div>
        </section>

        <section
          aria-labelledby="recent-title"
          className="border-b border-border/60 px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
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
          className="border-b border-border/60 bg-surface-1/40 px-4 py-14 sm:py-24 sm:px-6 lg:px-8"
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

              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-background/70 p-8 text-center backdrop-blur-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent">
                  <Globe className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-foreground">Claim Your SaaS Listing</h3>
                <p className="mt-2 text-xs text-muted-foreground max-w-xs">
                  Join 1,200+ verified tools. Takes under 90 seconds. Fast editorial review.
                </p>

                <div className="mt-6 w-full space-y-3">
                  <Magnet className="w-full">
                    <Link
                      href="/submit"
                      prefetch={false}
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lavender-glow transition-all hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Submit Your SaaS (Free Backlink)
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </Magnet>
                  <p className="text-[11px] text-subtle-foreground">
                    ✓ Free dofollow backlink &bull; Instant receipt confirmation
                  </p>
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
