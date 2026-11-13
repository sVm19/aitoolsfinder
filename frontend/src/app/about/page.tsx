import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Shield, Cpu, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About AIToolsFinder",
  description:
    "Learn about AIToolsFinder's mission to bring ground-truth intelligence, pricing transparency, and independent benchmarks to AI tooling.",
  alternates: { canonical: canonicalUrl("/about") },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <PageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      containerClassName="max-w-4xl"
    >
      <header className="border-l-2 border-primary/70 pl-6 sm:pl-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          Company · Mission
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          About AIToolsFinder
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          We build ground-truth intelligence for AI software. No marketing hype, no synthetic reviews, and no ungrounded claims.
        </p>
      </header>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="rounded-3xl border border-white/10 bg-surface-1/80 p-6 sm:p-8 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Independent & Unbiased
          </h2>
          <p className="mt-3">
            Every product in our catalog is benchmarked against verifiable capabilities, documented pricing tiers, and public uptime records. We never accept payment to inflate benchmark scores or alter feature matrices.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-surface-1/80 p-6 sm:p-8 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            Daily Verified Pricing
          </h2>
          <p className="mt-3">
            AI product pricing moves rapidly with token limits, credit tiers, and seat minimums. Our platform records verifiable price sources and last-verified timestamps for every published tier so you never get surprised by hidden costs.
          </p>
        </section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/explore">
            <Button variant="primary" size="md">
              Explore the catalog
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/methodology">
            <Button variant="outline" size="md">
              Read our scoring methodology
            </Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
