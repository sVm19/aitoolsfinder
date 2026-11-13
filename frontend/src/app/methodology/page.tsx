import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Scale, Award } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Scoring methodology",
  description: "How AIToolsFinder calculates and explains its versioned AI tool intelligence scores.",
  alternates: { canonical: canonicalUrl("/methodology") },
  robots: { index: true, follow: true },
};

const dimensions = [
  { name: "Feature breadth", weight: "30%", detail: "Supported features score 100, partial support 50, and unsupported features 0. Unknown feature records are excluded from this dimension." },
  { name: "Pricing transparency", weight: "25%", detail: "Each published plan checks whether its price or free status is known, its billing interval is known, and a pricing or source URL is supplied. Each check contributes equally." },
  { name: "Verification and freshness", weight: "25%", detail: "Verification contributes 60% of this dimension. A verification date contributes the remaining 40%: 100 points up to 30 days, 50 points from 31 to 180 days, and 0 after 180 days. If no date is recorded, only the verification signal is used." },
  { name: "Community and documentation", weight: "20%", detail: "This dimension remains unavailable until the catalog stores supported community and documentation signals." },
];

export default function MethodologyPage() {
  return (
    <PageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Scoring methodology" }]}
      containerClassName="max-w-4xl"
    >
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          Scoring methodology · v1
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          How tool scores are calculated
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Scores use evidence recorded directly in the catalog. Each dimension is audited separately with transparent weight distributions.
        </p>
      </header>

      <section aria-labelledby="score-dimensions-title" className="mt-10">
        <h2 id="score-dimensions-title" className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Scale className="w-5 h-5 text-accent" />
          Score dimensions & weights
        </h2>
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-surface-1/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
          <dl className="divide-y divide-border">
            {dimensions.map((dimension) => (
              <div key={dimension.name} className="grid gap-2 px-5 py-6 sm:grid-cols-[13rem_5rem_1fr] sm:gap-6 sm:px-6">
                <dt className="font-semibold text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary-content" />
                  {dimension.name}
                </dt>
                <dd className="text-sm font-bold text-accent font-mono">{dimension.weight}</dd>
                <dd className="text-sm leading-relaxed text-muted-foreground">{dimension.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="score-rules-title" className="mt-10 rounded-3xl border border-white/10 bg-surface-1/80 p-6 sm:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
        <h2 id="score-rules-title" className="text-xl font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Editorial integrity & score rules
        </h2>
        <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary-content">
          <li>The overall score is a weighted mean of dimensions with available evidence. Missing dimensions are excluded and remaining weights renormalized.</li>
          <li>Each stored score is a versioned snapshot. Rankings use the latest verified snapshot for each published tool in a category.</li>
          <li>Sponsored placement NEVER alters an intelligence score or organic rank. Sponsored tools are always disclosed and labeled.</li>
          <li>Free pricing filters include free and freemium tools. Paid filters include paid, usage-based, and contact-sales models.</li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/rankings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-content hover:text-white transition-colors"
        >
          Browse category rankings
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </PageShell>
  );
}
