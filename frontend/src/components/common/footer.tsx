import React from "react";
import Link from "next/link";
import { Sparkles, Shield, Cpu, ExternalLink } from "lucide-react";
import { canonicalUrl } from "@/lib/site";

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
    { name: "AI Finder Assistant", href: "/finder" },
    { name: "Scoring Methodology", href: "/methodology" },
    { name: "API Documentation", href: canonicalUrl("/api/docs") },
  ];

  const companyLinks = [
    { name: "About AIToolsFinder", href: "/about" },
    { name: "Submit a Tool", href: "/submit" },
    { name: "Vendor Claim & Verification", href: "/vendor" },
    { name: "Affiliate Transparency", href: "/transparency" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ];

  return (
    <footer className="w-full border-t border-border bg-background text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-lavender-glow">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                AIToolsFinder<span className="text-accent">.cloud</span>
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
              Find the best AI tool for your exact job. Daily audited pricing,
              independent intelligence benchmarks, and side-by-side capability
              comparisons.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-subtle-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>100% Unbiased Benchmarks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-primary-content" />
                <span>Daily Pricing Sync</span>
              </div>
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
                    href={`/category/${cat.slug}`}
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

