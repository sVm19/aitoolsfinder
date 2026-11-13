import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumb: string;
}

export function ComingSoon({
  eyebrow,
  title,
  description,
  breadcrumb,
}: ComingSoonProps) {
  return (
    <PageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: breadcrumb }]}
      containerClassName="max-w-2xl py-6 sm:py-12"
    >
      <div className="relative rounded-3xl border border-white/10 bg-surface-1/80 p-8 sm:p-12 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.7)] backdrop-blur-md">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-lavender-glow">
          <Clock aria-hidden="true" className="h-6 w-6" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/ai-finder">
            <Button variant="primary" size="md">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Try the AI Finder
              <ArrowRight aria-hidden="true" className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="outline" size="md">Browse the catalog</Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
