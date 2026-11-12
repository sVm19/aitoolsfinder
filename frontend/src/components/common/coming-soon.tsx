import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: breadcrumb }]}
            className="mb-8"
          />
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary-content">
            <Clock aria-hidden="true" className="h-5 w-5" />
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/ai-finder">
              <Button>
                Try the AI Finder
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline">Browse the catalog</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
