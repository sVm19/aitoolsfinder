import React from "react";
import Link from "next/link";
import { Shield, Cpu, ExternalLink } from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { canonicalUrl } from "@/lib/site";
import { NewsletterForm } from "@/components/common/newsletter-form";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const categories = [
    { name: "Productivity", slug: "productivity" },
    { name: "Developer Tools", slug: "developer-tools" },
    { name: "Marketing", slug: "marketing" },
    { name: "Writing", slug: "writing" },
    { name: "Video & Animation", slug: "video" },
    { name: "Design & Creative", slug: "design" },
    { name: "Sales & CRM", slug: "sales" },
    { name: "Automation & Workflows", slug: "automation" },
  ];

  const intelligenceLinks = [
    { name: "Explore All Tools", href: "/explore" },
    { name: "Curated Rankings", href: "/rankings" },
    { name: "Side-by-Side Comparisons", href: "/compare" },
    { name: "AI Finder Assistant", href: "/ai-finder" },
    { name: "Scoring Methodology", href: "/methodology" },
    { name: "API Documentation", href: canonicalUrl("/api/docs") },
  ];

  const companyLinks = [
    { name: "About AIToolsFinder", href: "/about" },
    { name: "Submit SaaS (Free Backlink)", href: "/submit" },
    { name: "Vendor Claim & Verification", href: "/vendor" },
    { name: "Affiliate Transparency", href: "/transparency" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ];

  return (
    <footer className="relative w-full overflow-hidden border-t border-border bg-background text-muted-foreground">
      <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-56 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <BrandLogo size="md" />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
              The verified AI & SaaS intelligence directory. Discover the best software
              for your exact job with audited pricing, side-by-side capability benchmarks,
              and free high-authority backlinks for SaaS founders.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-subtle-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Evidence-Based Benchmarks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-primary-content" />
                <span>Audited Catalog Pricing</span>
              </div>
            </div>

            <div className="mt-6 max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                Tuesday AI Drop & Arbitrage
              </p>
              <NewsletterForm />
            </div>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Top Categories
            </h4>
            <ul className="space-y-2.5 text-sm">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="hover:text-foreground hover:underline underline-offset-4 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Intelligence & Discovery */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Intelligence
            </h4>
            <ul className="space-y-2.5 text-sm">
              {intelligenceLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground hover:underline underline-offset-4 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Platform & Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground hover:underline underline-offset-4 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-subtle-foreground">
          <p>
            &copy; {currentYear}{" "}
            <span className="text-foreground font-medium">AIToolsFinder</span>.
            Official canonical domain:{" "}
            <a
              href={canonicalUrl("/")}
              className="text-primary-content hover:underline"
            >
              https://aitoolsfinder.cloud
            </a>
          </p>
          <p className="text-center sm:text-right">
            Disclosures: Some links may generate referral commissions at zero
            additional cost to you. Rankings remain strictly editorial.
          </p>
        </div>
      </div>
    </footer>
  );
}

