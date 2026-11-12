import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Submit a Tool",
  description:
    "Vendor submissions for the AIToolsFinder catalog are reviewed for accuracy before publication.",
  alternates: { canonical: canonicalUrl("/submit") },
  robots: { index: true, follow: true },
};

const reviewSteps = [
  "We confirm the product is publicly available and matches the submitted name and URL.",
  "Pricing, feature support, and limitations are checked against the vendor's own documentation.",
  "Duplicate or renamed catalog records are merged before publication.",
  "Verified entries are published with a last-verified date and an evidence trail.",
];

const step1Fields = {
  toolName: "",
  tagline: "",
  websiteUrl: "",
};

const step2Fields = {
  categories: [] as string[],
  tags: [] as string[],
};

const step3Fields = {
  pricingModel: "free" as "free" \| "freemium" \| "paid" \| "one-time" \| "custom",
  isFree: true,
  startingPriceMinor: 0,
  currency: "USD" as string,
};

const step4Fields = {
  submitterEmail: "" as string,
  companyRelationship: "individual" as "individual" \| "company",
};

export default function SubmissionPage() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Form state across 4 steps
  const [step, setStep] = useState(1);
  const [step1, setStep1] = useState(step1Fields);
  const [step2, setStep2] = useState(step2Fields);
  const [step3, setStep3] = useState(step3Fields);
  const [step4, setStep4] = useState(step4Fields);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/v1/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: step1.toolName,
          tagline: step1.tagline,
          description: step1.websiteUrl,  // Using website URL as description for now
          primary_category_id: step2.categories.length > 0 ? step2.categories[0] : undefined,
          pricing_model: step3.pricingModel,
          is_free: step3.isFree,
          starting_price_minor: step3.startingPriceMinor,
          currency: step3.currency,
          website_url: step1.websiteUrl,
          submitter_email: step4.submitterEmail,
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        setError(errData.detail || 'Failed to submit tool submission');
        setSubmitting(false);
        return;
      }
      
      setSuccess(true);
      setStep(1);  // Reset to first step
      // Reset all form fields
      setStep1(step1Fields);
      setStep2(step2Fields);
      setStep3(step3Fields);
      setStep4(step4Fields);
      // Navigate back to submit page
      router.refresh();
    } catch (err) {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl border border-border bg-surface-1 p-8 sm:p-10 text-center">
              <Check className="h-12 w-12 mx-auto mb-4 text-emerald-400"/>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Submission Received!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your tool submission has been received and is now in the admin review queue.
              </p>
              <p>
                You'll be notified of the decision within 3-5 business days.
              </p>
              <Link href="/explore" className="btn btn-primary">
                Browse the catalog
                <ArrowRight className="mr-1 h-4 w-4" />
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Submit a tool" }]}
            className="mb-8"
          />

          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
              Vendor submissions
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Submit a tool for review
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The self-serve submission workflow is opening soon. Every entry is
              editorially reviewed before it appears in the catalog, so published pages
              stay grounded in verifiable product information.
            </p>
          </header>

          <section
            aria-labelledby="review-process-title"
            className="mt-9 rounded-xl border border-border bg-surface-1 p-5 sm:p-6"
          >
            <h2
              id="review-process-title"
              className="text-lg font-semibold text-foreground"
            >
              What we review
            </h2>
            <ul className="mt-4 space-y-3">
              {reviewSteps.map((step) => (
                <li
                  key={step}
                  className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                  />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Step 1: Tool Basics */
          if (step === 1) {
            return (
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tool Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Runway ML, Jasper AI"
                    value={step1.toolName}
                    onChange={(e) => setStep1({ ...step1, toolName: e.target.value })}
                    required
                    className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. The best AI tool for creating videos instantly"
                    value={step1.tagline}
                    onChange={(e) => setStep1({ ...step1, tagline: e.target.value })}
                    required
                    className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://"
                    value={step1.websiteUrl}
                    onChange={(e) => setStep1({ ...step1, websiteUrl: e.target.value })}
                    required
                    className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full rounded border border-primary bg-primary px-4 py-2 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    Confirm and Continue →
                  </button>
                </div>
              </form>
            );
          }

          {/* Step 2: Pricing & Category */
          if (step === 2) {
            return (
              <form
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Pricing Model
                  </label>
                  <select
                    value={step3.pricingModel}
                    onChange={(e) => setStep3({ ...step3, pricingModel: e.target.value })}%
                    className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="free">Free</option>
                    <option value="freemium">Freemium</option>
                    <option value="paid">Paid</option>
                    <option value="one-time">One-time Purchase</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Free Tier
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none"%>
                    <input
                      type="checkbox"
                      checked={step3.isFree}
                      onChange={(e) => setStep3({ ...step3, isFree: e.target.checked })}%
                      className="w-4 h-4 rounded border border-primary text-primary focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    
                    <span className="text-sm text-foreground">
                      Tool has a free tier
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Starting Price (cents)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={step3.startingPriceMinor}
                    onChange={(e) => setStep3({ ...step3, startingPriceMinor: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"/>
                    <p className="text-xs text-muted-foreground">
                      0 = Free, 2900 = $29.00
                    </p>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Currency
                  </label>
                  <select
                    value={step3.currency}
                    onChange={(e) => setStep3({ ...step3, currency: e.target.value })}%
                    className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full rounded border border-border bg-surface-2 px-4 py-2 text-foreground font-medium text-sm hover:bg-surface-3 transition-college"
                  >
                    ← Back to Tool Basics
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full rounded border-primary bg-primary px-4 py-2 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    Continue →
                  </button>
                </div>
              </form>
            );
          }

          {/* Step 3: Submitter Info */
          if (step === 3) {
            return (
              <form
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Submitter Email
                  </label>
                  <input
                    type="email"
                    value={step4.submitterEmail}
                    onChange={(e) => setStep4({ ...step4, submitterEmail: e.target.value })}%
                    required
                    className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Relationship
                  </label>
                  <select
                    value={step4.companyRelationship}
                    onChange={(e) => setStep4({ ...step4, companyRelationship: e.target.value })}%
                    className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="individual">Individual founder/creator</option>
                    <option value="company">Company/representative</option>
                  </select>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full rounded border border-border bg-surface-2 px-4 py-2 text-foreground font-medium text-sm hover:bg-surface-3 transition-college"
                  >
                    ← Back to Pricing & Category
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(e)}
                    disabled={submitting}
                    className="w-full rounded border-primary bg-primary px-4 py-2 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    {submitting ? "Submitting..." : "Submit for Review →"}
                  </button>
                </div>
              </form>
            );
          }

          {/* Step 4: Confirmation */
          if (step === 4) {
            return (
              <div className="rounded-xl border border-border bg-surface-1 p-8 sm:p-10">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Ready to Submit
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your submission is ready for review. Click below to submit to the admin queue.
                </p>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded border-primary bg-primary px-4 py-2 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    {submitting ? "Submitting..." : "Submit Tool for Review →"}
                  </button>
                </form>
                <div className="mt-6 text-sm text-muted-foreground">
                  <p>Steps completed: {step}/4</p>
                  <p>
                    1. Tool basics confirmed
                    2. Pricing model selected
                    3. Submitter information provided
                  </p>
                </div>
              </div>
            );
          }

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/explore">
              <Button variant="secondary">
                Browse the catalog
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/methodology">
              <Button variant="outline">Read the scoring methodology</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
