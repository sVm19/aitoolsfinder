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
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { HeroCanvas } from "@/components/animations/hero-canvas";
import { MotionFadeIn } from "@/components/animations/motion-fade-in";
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
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function SectionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {children}
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="border-b border-border bg-surface-1 px-4 py-2 text-center text-xs text-muted-foreground">
        <span className="font-medium text-foreground">AIToolsFinder</span>
        <span className="mx-2 text-subtle-foreground" aria-hidden="true">·</span>
        <span>Find the best AI tool for your exact job</span>
      </div>

      <Navbar />

      <main className="flex-1">
        <section
          aria-labelledby="home-title"
          className="relative isolate overflow-hidden border-b border-border/60"
        >
          <div className="mx-auto grid min-h-[calc(100dvh-7rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
            <div className="relative z-10 max-w-2xl">
              <MotionFadeIn>
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  A practical AI tool directory
                </p>
                <h1
                  id="home-title"
                  className="max-w-[13ch] text-5xl font-semibold leading-[1.04] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
                >
                  Find the right AI tool for the{" "}
                  <span className="text-primary-content">work.</span>
                </h1>
              </MotionFadeIn>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Start with the job you need to do. Then compare tools using published features,
                pricing details, and clear category information.
              </p>

              <form
                action="/explore"
                method="get"
                role="search"
                className="mt-8 max-w-xl rounded-xl border border-border bg-surface-1 p-2 shadow-2xl transition-colors focus-within:border-primary/70 focus-within:shadow-lavender-glow"
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
                  <Button type="submit" size="lg" className="sm:px-5">
                    Search tools
                  </Button>
                </div>
              </form>
              <p className="mt-3 text-xs text-subtle-foreground">
                Try a task, a constraint, or a feature you need.
              </p>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
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

            <div
              data-visual="hero"
              className="relative mx-auto w-full max-w-xl rounded-3xl border border-border bg-surface-1 p-5 shadow-2xl sm:p-7"
            >
              <HeroCanvas />
              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-border/70 pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle-foreground">
                      The workflow
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">
                      From task to shortlist
                    </h2>
                  </div>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary-content">
                    Evidence first
                  </span>
                </div>

                <ol className="mt-5 space-y-3">
                  <li className="flex gap-4 rounded-xl border border-border/70 bg-background/80 p-4">
                    <span className="font-mono text-xs text-primary-content">01</span>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Describe the work</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Start with the task and the constraints that matter.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4 rounded-xl border border-border/70 bg-background/80 p-4">
                    <span className="font-mono text-xs text-primary-content">02</span>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Compare what is published</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Review features, pricing, and verification details.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4 rounded-xl border border-border/70 bg-background/80 p-4">
                    <span className="font-mono text-xs text-primary-content">03</span>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Choose with context</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        See why a tool fits before you make a decision.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="categories-title"
          className="border-b border-border/60 bg-surface-1/40 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              id="categories-title"
              eyebrow="Start with a category"
              title="Browse by the kind of work"
              description="Use the directory taxonomy to narrow the space before comparing individual tools."
            />
            <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categoryShortcuts.map((category) => (
                <CategoryCard
                  key={category.slug}
                  name={category.name}
                  slug={category.slug}
                  icon={category.icon}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="trending-title"
          className="border-b border-border/60 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
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
            <EmptyState
              title="No featured tools are shown yet"
              description="This space is reserved for published catalog entries with sourced product details."
              icon={<Blocks className="h-7 w-7" />}
              className="min-h-64 justify-center"
            />
          </div>
        </section>

        <section
          aria-labelledby="rankings-title"
          className="border-b border-border/60 bg-surface-1/40 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <SectionHeading
                id="rankings-title"
                eyebrow="Curated rankings"
                title="Rankings that show their work"
                description="A useful ranking needs clear criteria and evidence behind each placement. We’ll show the method alongside the list."
              />
              <div className="mt-7">
                <SectionLink href="/rankings">View rankings</SectionLink>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle-foreground">
                Ranking criteria
              </p>
              <ul className="mt-5 divide-y divide-border">
                <li className="flex items-center gap-3 py-4 text-sm text-foreground">
                  <Check aria-hidden="true" className="h-4 w-4 text-primary-content" />
                  Fit for the stated job
                </li>
                <li className="flex items-center gap-3 py-4 text-sm text-foreground">
                  <Check aria-hidden="true" className="h-4 w-4 text-primary-content" />
                  Published features and limits
                </li>
                <li className="flex items-center gap-3 py-4 text-sm text-foreground">
                  <Check aria-hidden="true" className="h-4 w-4 text-primary-content" />
                  Pricing and verification context
                </li>
              </ul>
              <p className="border-t border-border pt-4 text-xs leading-relaxed text-subtle-foreground">
                No placements are displayed until tool data and scoring methodology are available.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="comparisons-title"
          className="border-b border-border/60 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
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
            <div className="rounded-2xl border border-border bg-surface-1 p-5 sm:p-7">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex min-h-28 flex-col justify-between rounded-xl border border-dashed border-border bg-background p-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">Candidate one</span>
                  <span className="text-sm text-muted-foreground">Select a tool</span>
                </div>
                <GitCompareArrows aria-hidden="true" className="h-5 w-5 text-primary-content" />
                <div className="flex min-h-28 flex-col justify-between rounded-xl border border-dashed border-border bg-background p-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">Candidate two</span>
                  <span className="text-sm text-muted-foreground">Select a tool</span>
                </div>
              </div>
              <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-subtle-foreground">
                Comparison pages will use published catalog records; no sample products are shown here.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="finder-title"
          className="border-b border-border/60 bg-surface-1/40 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading
                id="finder-title"
                eyebrow="AI Finder"
                title="Describe the job. Keep your constraints."
                description="A guided shortlist can start from what you need to do, your budget, and the features you can’t work without."
              />
              <div className="mt-7">
                <SectionLink href="/finder">Explore AI Finder</SectionLink>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-accent" />
                Build a useful brief
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-border bg-surface-1 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-subtle-foreground">The task</p>
                  <p className="mt-2 text-sm text-muted-foreground">What do you want to get done?</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-surface-1 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-subtle-foreground">Budget</p>
                    <p className="mt-2 text-sm text-muted-foreground">Your price range</p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-1 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-subtle-foreground">Must-haves</p>
                    <p className="mt-2 text-sm text-muted-foreground">Features or limits</p>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-subtle-foreground">
                Recommendations are planned to use published catalog records and explain their fit.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="recent-title"
          className="border-b border-border/60 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading
              id="recent-title"
              eyebrow="Recently added"
              title="New tools, with their details intact"
              description="New listings should be easy to scan and easy to verify."
            />
            <EmptyState
              title="No recent listings are shown yet"
              description="Recently published catalog entries will appear here when they’re available."
              icon={<Sparkles className="h-7 w-7" />}
              className="min-h-64 justify-center"
            />
          </div>
        </section>

        <section
          aria-labelledby="editorial-title"
          className="border-b border-border/60 bg-surface-1/40 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
                Editorial
              </p>
              <h2 id="editorial-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Start with the work, not the hype.
              </h2>
            </div>
            <div className="max-w-3xl border-l-2 border-primary/60 pl-6 sm:pl-8">
              <p className="text-xl leading-relaxed text-foreground sm:text-2xl">
                Name the task. Decide what a good result looks like. Then check whether a tool’s features,
                limits, and price fit the way you work.
              </p>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Our guides will focus on practical fit and clearly sourced product details, so you can make
                a shortlist for your own needs.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="vendor-title" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-3xl border border-primary/30 bg-surface-1 p-7 sm:p-10 lg:flex-row lg:items-center lg:p-14">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">For builders</p>
              <h2 id="vendor-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Built an AI tool? Put it on the shortlist.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Share your product details so teams can understand what it does and who it helps.
              </p>
            </div>
            <Link
              href="/submit"
              prefetch={false}
              className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Submit a tool
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
