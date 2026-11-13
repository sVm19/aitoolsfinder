import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, FileText } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vendor Claim & Verification",
  description: "Claim your AI product listing, verify feature matrices, and manage your catalog presence on AIToolsFinder.",
  alternates: { canonical: canonicalUrl("/vendor") },
  robots: { index: true, follow: true },
};

export default function VendorHubPage() {
  return (
    <PageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Vendor portal" }]}
      containerClassName="max-w-4xl"
    >
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
          For software creators & teams
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Vendor Claim & Verification
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Keep your product details accurate, update pricing plans, submit verified benchmark proof, and reach decision-makers actively searching for tools.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-surface-1/80 p-6 sm:p-8 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary-content mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Submit a New Tool</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Have you built an AI tool or platform? Submit your product to our editorial queue for review and catalog inclusion.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/submit">
              <Button variant="primary" size="md" className="w-full">
                Submit your tool
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-surface-1/80 p-6 sm:p-8 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent mb-4">
              <BadgeCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Claim an Existing Listing</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              If your product is already listed, claim ownership to manage pricing accuracy, submit benchmark proof, and display verified badges.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/login">
              <Button variant="outline" size="md" className="w-full">
                Sign in to claim
                <Clock className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
