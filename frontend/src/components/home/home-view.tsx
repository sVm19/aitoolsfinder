"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  BriefcaseBusiness,
  Check,
  Code2,
  GitCompareArrows,
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
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const categoryShortcuts = [
  { name: "Productivity", slug: "productivity", icon: <Workflow aria-hidden="true" className="h-5 w-5" /> },
  { name: "Developer Tools", slug: "developer-tools", icon: <Code2 aria-hidden="true" className="h-5 w-5" /> },
  { name: "Marketing", slug: "marketing", icon: <Megaphone aria-hidden="true" className="h-5 w-5" /> },
  { name: "Writing", slug: "writing", icon: <PenLine aria-hidden="true" className="h-5 w-5" /> },
  { name: "AI", slug: "ai", icon: <Sparkles aria-hidden="true" className="h-5 w-5" /> },
  { name: "Business", slug: "business", icon: <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" /> },
];

const workflowSteps = [
  {
    index: "01",
    title: "Describe the work",
    body: "Start with the task, the budget, and the constraints that actually change the shortlist.",
  },
  {
    index: "02",
    title: "Compare what is published",
    body: "Review features, pricing, and verification details from the catalog record, side by side.",
  },
  {
    index: "03",
    title: "Choose with context",
    body: "See why a tool fits the job before you open another tab of marketing copy.",
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
  const rootRef = useRef<HTMLDivElement>(null);

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

          <div className="relative z-10 mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.8fr)] lg:px-8">
            <div className="max-w-2xl">
              <p data-hero-item className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface-1/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                A practical AI tool directory
              </p>
              <SplitText
                as="h1"
                id="home-title"
                text="Find the right AI tool for the work."
                accent="work."
                className="max-w-[13ch] text-5xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
              />
              <p data-hero-item className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Start with the job you need to do. Then compare tools using published features,
                pricing details, and clear category information.
              </p>

              <form
                data-hero-item
                action="/explore"
                method="get"
                role="search"
                className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-surface-1/75 p-2 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.7)] backdrop-blur-md transition-colors focus-within:border-primary/70"
              >
                <label htmlFor="tool-query" className="sr-only">
                  Describe the work you need an AI tool to do
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                    <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <input
                      id="tool-query"
                      name="q"
                      type="search"
                      required
                      placeholder="What are you trying to get done?"
                      className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle-foreground"
                    />
                  </div>
                  <Magnet strength={0.18} className="w-full sm:w-auto">
                    <Button type="submit" size="lg" className="w-full sm:w-auto sm:px-6">
                      Search tools
                    </Button>
                  </Magnet>
                </div>
              </form>
              <p data-hero-item className="mt-3 text-xs text-subtle-foreground">
                Try a task, a constraint, or a feature you need.
              </p>

              <div data-hero-item className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary-content" />
                  Sourced product details
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary-content" />
                  Clear pricing context
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
            "Productivity",
            "Developer tools",
            "Marketing",
            "Writing",
            "Rankings",
            "Comparisons",
            "AI Finder",
            "Published pricing",
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
                eyebrow="The workflow"
                title="From task to shortlist"
                description="Evidence first. Each step stays tied to what a tool actually publishes."
              />
              <div className="relative mt-10 hidden h-32 w-32 lg:block" aria-hidden="true">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-xl" />
                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-orange-glow" />
              </div>
            </div>

            <ol className="relative space-y-5 pl-2">
              <div
                data-progress
                className="absolute bottom-6 left-[1.35rem] top-6 w-px origin-top bg-gradient-to-b from-primary-content via-accent to-transparent"
                aria-hidden="true"
              />
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
                    className="h-full min-h-40"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="trending-title"
          className="border-b border-border/60 px-4 py-12 sm:py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div data-reveal>
              <SectionHeading
                id="trending-title"
                eyebrow="Trending tools"
                title="Good picks start with good data"
                description="Featured tools belong here once their published details can be shown and checked."
              />
              <div className="mt-7">
                <SectionLink href="/explore">Explore the directory</SectionLink>
              </div>
            </div>
            <div data-reveal>
              <EmptyState
                title="No featured tools are shown yet"
                description="This space is reserved for published catalog entries with sourced product details."
                icon={<Blocks className="h-7 w-7" />}
                className="min-h-64 justify-center"
              />
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
              <ul className="mt-5 divide-y divide-border">
                {[
                  "Fit for the stated job",
                  "Published features and limits",
                  "Pricing and verification context",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 py-4 text-sm text-foreground">
                    <Check aria-hidden="true" className="h-4 w-4 text-primary-content" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="border-t border-border pt-4 text-xs leading-relaxed text-subtle-foreground">
                No placements are displayed until tool data and scoring methodology are available.
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
                <div className="flex min-h-28 flex-col justify-between rounded-2xl border border-dashed border-border bg-background p-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">Candidate one</span>
                  <span className="text-sm text-muted-foreground">Select a tool</span>
                </div>
                <GitCompareArrows aria-hidden="true" className="h-5 w-5 text-primary-content" />
                <div className="flex min-h-28 flex-col justify-between rounded-2xl border border-dashed border-border bg-background p-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">Candidate two</span>
                  <span className="text-sm text-muted-foreground">Select a tool</span>
                </div>
              </div>
              <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-subtle-foreground">
                Comparison pages use published catalog records. No sample products are shown here.
              </p>
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
            <div data-reveal>
              <EmptyState
                title="No recent listings are shown yet"
                description="Recently published catalog entries will appear here when they're available."
                icon={<Sparkles className="h-7 w-7" />}
                className="min-h-64 justify-center"
              />
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
          <SpotlightPanel className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] border border-primary/30 bg-surface-1 p-7 sm:p-10 lg:flex-row lg:items-center lg:p-14">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">For builders</p>
              <h2 id="vendor-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Built an AI tool? Put it on the shortlist.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Share your product details so teams can understand what it does and who it helps.
              </p>
            </div>
            <Magnet>
              <Link
                href="/submit"
                prefetch={false}
                className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Submit a tool
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Magnet>
          </SpotlightPanel>
        </section>
      </main>

      <Footer />
    </div>
  );
}
