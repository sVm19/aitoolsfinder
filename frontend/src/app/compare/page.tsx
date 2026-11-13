import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GitCompare, Sparkles, Layers } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Compare AI Tools Side-by-Side",
  description:
    "Compare features, pricing tiers, limitations, and benchmark scores across leading AI tools.",
  alternates: { canonical: canonicalUrl("/compare") },
  robots: { index: true, follow: true },
};

const POPULAR_COMPARISONS = [
  {
    title: "Midjourney vs Stable Diffusion",
    slug: "midjourney-vs-stable-diffusion",
    category: "Image Generation",
    description: "Compare prompt accuracy, pricing models, and commercial licensing rights.",
  },
  {
    title: "Claude vs ChatGPT",
    slug: "claude-vs-chatgpt",
    category: "LLM & Reasoning",
    description: "Compare context window sizes, coding capability, pricing, and API throughput.",
  },
  {
    title: "Cursor vs GitHub Copilot",
    slug: "cursor-vs-github-copilot",
    category: "Developer Tools",
    description: "Compare codebase-indexing, agentic workflows, multi-model access, and subscription rates.",
  },
  {
    title: "ElevenLabs vs Murf AI",
    slug: "elevenlabs-vs-murf-ai",
    category: "Audio & Voice",
    description: "Compare voice cloning fidelity, character allocation, and commercial licensing.",
  },
];

export default function CompareHubPage() {
  return (
    <PageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Compare" }]}
      containerClassName="max-w-5xl"
    >
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          Side-by-side analysis
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Compare AI tools side by side
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Evaluate features, pricing tiers, limitation matrices, and verified benchmark ratings before committing to a tool.
        </p>
      </header>

      <section aria-labelledby="custom-compare-title" className="mt-8 rounded-3xl border border-white/10 bg-surface-1/80 p-6 sm:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 id="custom-compare-title" className="text-xl font-semibold text-foreground flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-accent" />
              Build a custom comparison
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Browse our catalog in Explore, click &ldquo;Add to compare&rdquo; on any two to four tools, and inspect their side-by-side capability matrix in real time.
            </p>
          </div>
          <Link href="/explore">
            <Button variant="primary" size="md" className="shrink-0">
              Browse catalog to compare
              <ArrowRight aria-hidden="true" className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>

      <section aria-labelledby="curated-comparisons-title" className="mt-12">
        <h2 id="curated-comparisons-title" className="text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
          <Layers className="w-5 h-5 text-primary-content" />
          Featured comparisons
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {POPULAR_COMPARISONS.map((comp) => (
            <Link
              key={comp.slug}
              href={`/compare/${comp.slug}`}
              className="group relative rounded-2xl border border-border bg-surface-1 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
            >
              <span className="inline-block rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-accent">
                {comp.category}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-foreground group-hover:text-primary-content transition-colors">
                {comp.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {comp.description}
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-primary-content group-hover:translate-x-0.5 transition-transform">
                View comparison
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
