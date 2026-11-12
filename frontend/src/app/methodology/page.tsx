import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs className="mb-8" items={[{ label: "Home", href: "/" }, { label: "Scoring methodology" }]} />
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">Scoring methodology · v1</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">How tool scores are calculated</h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              Scores use evidence already recorded in the catalog. Each dimension is shown separately so you can see what contributed and what data is missing.
            </p>
          </header>

          <section aria-labelledby="score-dimensions-title" className="mt-9">
            <h2 id="score-dimensions-title" className="text-xl font-semibold text-foreground">Score dimensions</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface-1">
              <dl className="divide-y divide-border">
                {dimensions.map((dimension) => (
                  <div key={dimension.name} className="grid gap-2 px-4 py-5 sm:grid-cols-[13rem_5rem_1fr] sm:gap-5 sm:px-5">
                    <dt className="font-semibold text-foreground">{dimension.name}</dt>
                    <dd className="text-sm font-semibold text-primary-content">{dimension.weight}</dd>
                    <dd className="text-sm leading-relaxed text-muted-foreground">{dimension.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section aria-labelledby="score-rules-title" className="mt-9 rounded-xl border border-border bg-surface-1 p-5 sm:p-6">
            <h2 id="score-rules-title" className="text-xl font-semibold text-foreground">How to read the overall score</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary-content">
              <li>The overall score is a weighted mean of dimensions with available evidence. Missing dimensions are excluded and the remaining weights are renormalized.</li>
              <li>Each stored score is a versioned snapshot. Rankings use the latest snapshot for each published tool in a category.</li>
              <li>Sponsored placement does not change an intelligence score or an organic rank. Sponsored tools are labeled and listed separately.</li>
              <li>Free pricing filters include free and freemium tools. Paid filters include paid, usage-based, and contact-sales models; unknown pricing is left out of those filtered views.</li>
            </ul>
          </section>

          <p className="mt-8 text-sm text-muted-foreground">
            <Link href="/rankings" className="text-primary-content underline underline-offset-4 hover:text-foreground">Browse category rankings</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
