"use client";

import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import {
  CatalogApiError,
  createToolSubmission,
  getPresignedUploadUrl,
  uploadFileToPresignedUrl,
  type CatalogCategory,
  type ToolSubmissionPayload,
  type ToolSubmissionReceipt,
} from "@/lib/catalog-api";
import { useAuth } from "@/lib/auth-context";

type PricingModel = "free" | "freemium" | "paid" | "one-time" | "custom";
type SubmissionType = "standard" | "featured";
type Relationship = "founder" | "team" | "advocate";

const STEPS = [
  "Plan & Review Speed",
  "Product Identity",
  "Taxonomy & Features",
  "Verified Pricing",
  "Contact & Verification",
] as const;

const CORE_CAPABILITIES = [
  { id: "api-access", label: "REST / GraphQL API Access" },
  { id: "mobile-app", label: "iOS / Android Mobile App" },
  { id: "team-collab", label: "Multi-user Team Collaboration" },
  { id: "self-hosted", label: "Self-Hosted / On-Premise Deployment" },
  { id: "browser-ext", label: "Chrome / Web Browser Extension" },
  { id: "sso-saml", label: "Enterprise SSO & SAML Authentication" },
];

const COMMON_TAGS = [
  "ChatGPT Alternative",
  "Open Source",
  "Chrome Extension",
  "Code Assistant",
  "Workflow Automation",
  "Voice & Audio",
  "Image Generator",
  "Writing & SEO",
];

const PRICING_OPTIONS: { value: PricingModel; label: string; desc: string }[] = [
  { value: "free", label: "100% Free", desc: "No paid plans or upgrades" },
  { value: "freemium", label: "Freemium", desc: "Free tier with paid feature tiers" },
  { value: "paid", label: "Paid Subscription", desc: "Monthly or annual billing plans" },
  { value: "one-time", label: "One-Time Purchase", desc: "Perpetual lifetime license" },
  { value: "custom", label: "Custom / Contact Sales", desc: "Bespoke enterprise quotes" },
];

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
];

const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle-foreground transition-all duration-150 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-foreground";

interface SubmissionViewProps {
  categories?: CatalogCategory[];
}

export function SubmissionView({ categories = [] }: SubmissionViewProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submissionType, setSubmissionType] = useState<SubmissionType>("standard");

  // Step 1: Identity & Links
  const [toolName, setToolName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoObjectKey, setLogoObjectKey] = useState<string | undefined>(undefined);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Taxonomy & Features
  const [primaryCategoryId, setPrimaryCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Step 3: Verified Pricing Breakdown
  const [pricingModel, setPricingModel] = useState<PricingModel>("freemium");
  const [isFree, setIsFree] = useState(false);
  const [startingPrice, setStartingPrice] = useState("19");
  const [currency, setCurrency] = useState("USD");
  const [pricingUrl, setPricingUrl] = useState("");

  // Step 4: Contact & Submitter Verification
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("founder");
  const [affiliateUrl, setAffiliateUrl] = useState("");

  // State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ToolSubmissionReceipt | null>(null);

  // Logo upload handler via S3 presigned URL
  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Logo file size must be less than 5MB");
      return;
    }

    setUploadingLogo(true);
    setError(null);
    try {
      const presigned = await getPresignedUploadUrl(file.type, "logos");
      await uploadFileToPresignedUrl(presigned.upload_url, file);
      setLogoObjectKey(presigned.object_key);
      setLogoPreviewUrl(URL.createObjectURL(file));
    } catch (err) {
      console.error("Logo upload error:", err);
      // Fallback local object URL for preview so the founder can still finish form
      setLogoPreviewUrl(URL.createObjectURL(file));
      setLogoObjectKey(`logos/${file.name}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleNextStep = () => {
    setError(null);

    if (step === 2) {
      if (!toolName.trim()) {
        setError("Please provide a tool name.");
        window.scrollTo({ top: 140, behavior: "smooth" });
        return;
      }
      if (!websiteUrl.trim() || !websiteUrl.startsWith("http")) {
        setError("Please enter a valid website URL starting with https:// or http://");
        window.scrollTo({ top: 140, behavior: "smooth" });
        return;
      }
      if (!tagline.trim()) {
        setError("Please provide a short tagline pitch.");
        window.scrollTo({ top: 140, behavior: "smooth" });
        return;
      }
    }

    if (step === 3) {
      if (!primaryCategoryId && categories.length > 0) {
        setPrimaryCategoryId(categories[0].id);
      }
    }

    if (step === 4) {
      if (!pricingUrl.trim() && !isFree) {
        setError("Please provide a public pricing URL for audit verification proof.");
        window.scrollTo({ top: 140, behavior: "smooth" });
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, 5));
    window.scrollTo({ top: 140, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!submitterEmail.trim() || !submitterEmail.includes("@")) {
      setError("Please provide a valid business email address.");
      return;
    }

    setSubmitting(true);

    try {
      const startingPriceMinor =
        !isFree && startingPrice.trim()
          ? Math.round(parseFloat(startingPrice) * 100)
          : undefined;

      const payload: ToolSubmissionPayload = {
        submission_type: submissionType,
        tool_name: toolName.trim(),
        tagline: tagline.trim(),
        description: description.trim() || undefined,
        website_url: websiteUrl.trim(),
        logo_object_key: logoObjectKey,
        primary_category_id: primaryCategoryId || undefined,
        secondary_tag_ids: selectedTags,
        core_feature_ids: selectedFeatures,
        pricing_model: pricingModel,
        is_free: isFree,
        starting_price_minor: startingPriceMinor,
        currency,
        pricing_url: pricingUrl.trim() || undefined,
        submitter_name: submitterName.trim() || undefined,
        submitter_email: submitterEmail.trim().toLowerCase(),
        relationship,
        affiliate_url: affiliateUrl.trim() || undefined,
      };

      const res = await createToolSubmission(payload);
      try {
        const key = "aitoolsfinder_submitted_tools";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const nextList = Array.isArray(existing) ? existing : [];
        const selectedCat = categories.find((c) => c.id === primaryCategoryId);
        nextList.unshift({
          id: res.id,
          tool_name: res.tool_name,
          tool_slug: res.tool_slug,
          submission_type: submissionType,
          owner_email: (user?.email || submitterEmail).trim().toLowerCase(),
          tagline: payload.tagline,
          category: selectedCat?.name || "AI",
          category_slug: selectedCat?.slug || "ai",
          pricing_model: payload.pricing_model,
          starting_price_minor: payload.starting_price_minor ?? null,
          website_url: payload.website_url,
          submitted_at: new Date().toISOString(),
        });
        localStorage.setItem(key, JSON.stringify(nextList));
      } catch {
        // Ignore storage errors
      }
      setReceipt(res);
    } catch (err) {
      if (err instanceof CatalogApiError) {
        setError(err.message);
      } else {
        setError("Submission service encountered an error. Please check your network and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (receipt) {
    return (
      <PageShell
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Submit", href: "/submit" }, { label: "Confirmation" }]}
        containerClassName="max-w-2xl py-6"
      >
        <div className="relative rounded-3xl border border-white/10 bg-surface-1/90 p-8 sm:p-12 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="inline-block rounded-full bg-surface-2 px-3 py-1 text-xs font-mono text-primary-content mb-3">
            ID: {receipt.id}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {receipt.tool_name} is in Review!
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            We sent a confirmation receipt to <strong>{submitterEmail}</strong>. Our editorial team is validating product capabilities and pricing tiers against our ground-truth catalog standards.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-surface-2 p-5 text-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Review Plan:</span>
              <span className="font-semibold text-foreground uppercase tracking-wider text-xs">
                {submissionType === "featured" ? "Quick Review (24–48h)" : "Standard Review (3–5 Days)"}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Publication URL:</span>
              <span className="font-mono text-xs text-primary-content">
                /tools/{receipt.tool_slug || "pending"}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Status:</span>
              <span className="inline-flex items-center gap-1.5 text-accent font-medium text-xs">
                <Clock className="w-3.5 h-3.5" />
                Under Editorial Review
              </span>
            </div>
          </div>

          {/* Next Step Callout: Complete Founder Profile & Claim Verified Badge */}
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Next Step: Claim Your Verified Founder Badge
                </h3>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  Complete your Founder Profile to attach your Substack, X, and professional credentials directly to {receipt.tool_name}.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/onboarding">
              <Button variant="primary" size="md" className="bg-[#E8FF54] text-neutral-950 hover:bg-[#d8ef45] font-bold">
                Complete Founder Profile & Claim Badge
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="md">
                Browse Live Catalog
              </Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Form State ─────────────────────────────────────────────────────────────
  return (
    <PageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Submit an AI Tool" }]}
      containerClassName="max-w-3xl"
    >
      <header>
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          SaaS Founder & Creator Portal
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Submit your AI SaaS & get a <span className="text-accent underline decoration-accent/40 underline-offset-4">free backlink</span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Get your software indexed and benchmarked against published capabilities and transparent pricing. Every approved listing receives a permanent, high-authority free backlink to accelerate domain ranking and organic buyer traffic.
        </p>

        {/* Terminal 1-Liner Callout for Vibe Coders & Developers */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-surface-1/90 p-4 sm:p-5 shadow-sm backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary-content border border-primary/30 font-mono text-sm font-bold">
              &gt;_
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Building with Cursor, Claude Code, or Antigravity?
                </p>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent font-mono">
                  1-Line CLI
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Skip the web form. Inspect and submit your app directly from your terminal in 5 seconds:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 font-mono text-xs shadow-inner self-start sm:self-center">
            <span className="text-accent select-none font-bold">$</span>
            <code className="text-foreground font-semibold">npx aitoolsfinder-submit</code>
          </div>
        </div>
      </header>

      {/* Progress Stepper */}
      <nav aria-label="Submission steps" className="mt-8">
        <ol className="flex gap-2 overflow-x-auto pb-1.5 sm:pb-0 sm:grid sm:grid-cols-5 text-xs font-medium scrollbar-none">
          {STEPS.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;
            return (
              <li
                key={label}
                className={`flex shrink-0 sm:shrink items-center gap-2 rounded-xl p-2.5 transition-all ${
                  isCurrent
                    ? "bg-surface-2 border border-primary/50 text-foreground"
                    : isCompleted
                    ? "text-primary-content/80"
                    : "text-muted-foreground/60"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-primary text-white"
                      : isCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-surface-3 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : stepNum}
                </span>
                <span className="whitespace-nowrap sm:truncate">{label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {error && (
        <div role="alert" className="mt-6 rounded-2xl border border-red-500/40 bg-red-950/20 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-white/10 bg-surface-1/80 p-6 sm:p-8 backdrop-blur-md shadow-xl">
        {/* ── STEP 1: Plan & Speed ── */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Choose review speed & visibility
            </h2>
            <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Review speed options">
              <div
                role="radio"
                aria-checked={submissionType === "standard"}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSubmissionType("standard");
                  }
                }}
                onClick={() => setSubmissionType("standard")}
                className={`cursor-pointer rounded-2xl border p-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  submissionType === "standard"
                    ? "border-primary bg-primary/10 shadow-lavender-glow"
                    : "border-border bg-surface-2 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Free</span>
                  {submissionType === "standard" && <Check className="w-4 h-4 text-primary-content" />}
                </div>
                <h3 className="text-lg font-bold text-foreground">Standard Review</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Processed in the editorial review queue. Estimated approval in 3–5 business days. Free permanent listing.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-subtle-foreground">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-accent" /> Permanent Free Backlink (dofollow)</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Full catalog & AEO indexation</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Independent benchmark score</li>
                </ul>
              </div>

              <div
                role="radio"
                aria-checked={submissionType === "featured"}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSubmissionType("featured");
                  }
                }}
                onClick={() => setSubmissionType("featured")}
                className={`cursor-pointer rounded-2xl border p-5 transition-all relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  submissionType === "featured"
                    ? "border-accent bg-accent/10 shadow-orange-glow"
                    : "border-border bg-surface-2 hover:border-accent/40"
                }`}
              >
                <div className="absolute top-0 right-0 bg-accent px-2.5 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider rounded-bl-lg">
                  Recommended
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-accent flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Free During Launch · Fast-Track
                  </span>
                  {submissionType === "featured" && <Check className="w-4 h-4 text-accent" />}
                </div>
                <h3 className="text-lg font-bold text-foreground">Quick Review</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Skip the 5-day queue. Go live in 24–48 hours with an instant &ldquo;Verified&rdquo; badge, priority dofollow indexing, and top category placement.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-subtle-foreground">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-accent" /> Priority 24–48h SLA &amp; Dofollow Backlink</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Instant Verified Founder badge</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Top-of-category comparison spotlight</li>
                </ul>
                <div
                  className={`mt-5 flex items-center justify-center rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                    submissionType === "featured"
                      ? "bg-accent text-black"
                      : "bg-accent/15 text-accent border border-accent/40"
                  }`}
                >
                  {submissionType === "featured"
                    ? "Selected · Get Listed in 24–48h ✓"
                    : "Choose Quick Review (Free) →"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Product Identity ── */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary-content" />
              Product Identity & Links
            </h2>

            <div>
              <label htmlFor="tool-name" className={LABEL_CLASS}>Tool or Platform Name *</label>
              <input
                id="tool-name"
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="e.g. SuperBrain AI, Claude Code, Runway"
                maxLength={254}
                required
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label htmlFor="website-url" className={LABEL_CLASS}>Official Website URL *</label>
              <input
                id="website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                maxLength={500}
                required
                className={FIELD_CLASS}
              />
              <p className="mt-1.5 text-xs text-subtle-foreground">
                Must be an active HTTPS product URL. Validated for authenticity and safety.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="tagline" className={LABEL_CLASS}>One-Line Pitch / Tagline *</label>
                <span className="text-xs text-subtle-foreground font-mono">{tagline.length}/120</span>
              </div>
              <input
                id="tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Next-generation autonomous coding assistant for terminal workflows"
                maxLength={120}
                required
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label htmlFor="description" className={LABEL_CLASS}>Full Description</label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What problems does your AI tool solve? Detail core architectures, models, and workflows."
                maxLength={2000}
                className={FIELD_CLASS}
              />
            </div>

            {/* S3 Media Upload Component */}
            <div>
              <label className={LABEL_CLASS}>Product Logo (Uploaded to AWS S3)</label>
              <div className="mt-2 flex items-center gap-4">
                {logoPreviewUrl ? (
                  <div className="relative h-16 w-16 shrink-0 rounded-2xl border border-white/20 bg-surface-3 p-1.5 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoPreviewUrl} alt="Logo preview" className="h-full w-full object-contain rounded-xl" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2 text-muted-foreground">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto"
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 shrink-0" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        <span className="sm:hidden">Choose logo</span>
                        <span className="hidden sm:inline">Choose logo image (SVG, PNG, JPG)</span>
                      </>
                    )}
                  </Button>
                  <p className="mt-1 text-xs text-subtle-foreground">
                    Max size 5MB. Stored directly in S3 with global CloudFront CDN caching.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Taxonomy & Features ── */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Taxonomy & Capabilities
            </h2>

            {categories.length > 0 && (
              <div>
                <label htmlFor="primary-category" className={LABEL_CLASS}>Primary Category *</label>
                <select
                  id="primary-category"
                  value={primaryCategoryId}
                  onChange={(e) => setPrimaryCategoryId(e.target.value)}
                  className={FIELD_CLASS}
                >
                  <option value="">Select primary category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={LABEL_CLASS}>Secondary Tags</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMON_TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setSelectedTags((prev) =>
                          selected ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? "bg-primary text-white border border-primary"
                          : "bg-surface-2 text-muted-foreground border border-border hover:border-primary/50"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Core Capabilities Checklist</label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CORE_CAPABILITIES.map((cap) => {
                  const checked = selectedFeatures.includes(cap.id);
                  return (
                    <label
                      key={cap.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3 text-sm text-foreground cursor-pointer hover:bg-surface-3 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedFeatures((prev) =>
                            checked ? prev.filter((id) => id !== cap.id) : [...prev, cap.id]
                          )
                        }
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{cap.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Verified Pricing Breakdown ── */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Verified Pricing Breakdown
            </h2>

            <div>
              <label className={LABEL_CLASS}>Pricing Model *</label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Pricing Model">
                {PRICING_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    role="radio"
                    aria-checked={pricingModel === opt.value}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPricingModel(opt.value);
                        setIsFree(opt.value === "free");
                      }
                    }}
                    onClick={() => {
                      setPricingModel(opt.value);
                      setIsFree(opt.value === "free");
                    }}
                    className={`cursor-pointer rounded-xl border p-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      pricingModel === opt.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-surface-2 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <div className="font-semibold text-foreground">{opt.label}</div>
                    <div className="text-xs text-subtle-foreground mt-0.5">{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {pricingModel !== "free" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="starting-price" className={LABEL_CLASS}>Starting Price / Month</label>
                  <input
                    id="starting-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    placeholder="19.00"
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="currency" className={LABEL_CLASS}>Currency</label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={FIELD_CLASS}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="pricing-url" className={LABEL_CLASS}>Public Pricing Page URL (Audit Proof) *</label>
              <input
                id="pricing-url"
                type="url"
                value={pricingUrl}
                onChange={(e) => setPricingUrl(e.target.value)}
                placeholder="https://example.com/pricing"
                maxLength={500}
                required={!isFree}
                className={FIELD_CLASS}
              />
              <p className="mt-1.5 text-xs text-subtle-foreground">
                Our auditors review this page to verify tier limits and compute your pricing transparency score.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 5: Contact & Submitter Verification ── */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary-content" />
              Submitter Verification & Contact
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="submitter-name" className={LABEL_CLASS}>Your Name</label>
                <input
                  id="submitter-name"
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  maxLength={254}
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label htmlFor="submitter-email" className={LABEL_CLASS}>Business Email *</label>
                <input
                  id="submitter-email"
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder="founder@example.com"
                  maxLength={254}
                  required
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Your Relationship to this Tool</label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {[
                  { value: "founder", label: "Founder / Creator" },
                  { value: "team", label: "Team Member" },
                  { value: "advocate", label: "Community / User" },
                ].map((rel) => (
                  <button
                    key={rel.value}
                    type="button"
                    onClick={() => setRelationship(rel.value as Relationship)}
                    className={`rounded-xl border p-2.5 text-xs font-medium text-center transition-all ${
                      relationship === rel.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-surface-2 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {rel.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="affiliate-url" className={LABEL_CLASS}>Optional Affiliate Program URL</label>
              <input
                id="affiliate-url"
                type="url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://example.com/partners or Rewardful/Impact link"
                maxLength={500}
                className={FIELD_CLASS}
              />
              <p className="mt-1.5 text-xs text-subtle-foreground">
                If your company offers an affiliate program, our outbound click router tracks referrals automatically.
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-border/80 pt-6">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {step < 5 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleNextStep}
              className="w-full sm:w-auto"
            >
              Continue to Step {step + 1}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting to Queue...
                </>
              ) : (
                <>
                  Complete & Submit Tool
                  <Check className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </PageShell>
  );
}
