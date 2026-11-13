import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ShieldCheck, DollarSign, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Affiliate & Monetization Transparency",
  description: "Our commitment to independent rankings, sponsored disclosure, and transparent monetization practices.",
  alternates: { canonical: canonicalUrl("/transparency") },
  robots: { index: true, follow: true },
};

export default function TransparencyPage() {
  return (
    <PageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Affiliate transparency" }]}
      containerClassName="max-w-4xl"
    >
      <header className="border-l-2 border-primary/70 pl-6 sm:pl-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          Integrity & Disclosures
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Affiliate & Commercial Transparency
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Clear standards on how AIToolsFinder generates revenue without compromising benchmark accuracy or editorial integrity.
        </p>
      </header>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="rounded-3xl border border-white/10 bg-surface-1/80 p-6 sm:p-8 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent" />
            Affiliate Links
          </h2>
          <p className="mt-3">
            Some outbound links to external AI tool websites contain affiliate tracking parameters. When you click these links and purchase a plan, AIToolsFinder may receive a referral commission at no additional cost to you.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-surface-1/80 p-6 sm:p-8 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary-content" />
            Editorial Independence & Scoring
          </h2>
          <p className="mt-3">
            Affiliate partnerships never influence our intelligence scores, category rankings, or AI recommendations. Our scoring model evaluates features, documented limitations, price transparency, and verified uptime mathematically based on catalog data.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-surface-1/80 p-6 sm:p-8 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Sponsored Listings Disclosure
          </h2>
          <p className="mt-3">
            If a tool vendor sponsors a placement, that listing is explicitly marked with a &ldquo;Sponsored&rdquo; badge. Sponsored tools must still be verified for factual feature accuracy before appearing in the directory.
          </p>
        </section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/methodology">
            <Button variant="primary" size="md">
              Review our scoring methodology
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/privacy">
            <Button variant="outline" size="md">
              Read our privacy policy
            </Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
