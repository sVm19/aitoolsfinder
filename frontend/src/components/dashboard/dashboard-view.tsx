"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCheck,
  Clock,
  Copy,
  ExternalLink,
  FolderGit2,
  GitCompareArrows,
  Globe,
  Link2,
  Sparkles,
  Terminal,
  User,
} from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { getMySubmissions } from "@/lib/catalog-api";

export const SUBMITTED_TOOLS_STORAGE_KEY = "aitoolsfinder_submitted_tools";

export interface StoredSubmission {
  id: string;
  tool_name: string;
  tool_slug?: string | null;
  submission_type: "standard" | "featured";
  owner_email?: string;
  status?: string;
  website_url?: string;
  submitted_at: string;
}

interface StoredFounderProfile {
  founder_name: string;
  handle: string;
  headline: string;
  bio: string;
  is_verified?: boolean;
}

const VALUE_PILLARS = [
  {
    icon: Link2,
    title: "Permanent Free Dofollow Backlink",
    detail:
      "Lock in a high-authority dofollow link to strengthen domain rating and organic search rankings at zero cost.",
    accent: "text-accent",
  },
  {
    icon: GitCompareArrows,
    title: "Show Up Where Buyers Compare",
    detail:
      "Appear in category rankings, side-by-side comparison matrices, and AI Finder recommendations when teams shortlist software.",
    accent: "text-primary-content",
  },
  {
    icon: Sparkles,
    title: "AI Search Citation (AEO)",
    detail:
      "Structured JSON-LD and llms.txt indexing so ChatGPT, Perplexity, and Claude surface your product accurately.",
    accent: "text-emerald-400",
  },
];

export function DashboardView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const tabParam = searchParams.get("tab");
  const activeTab: "submissions" | "profile" =
    tabParam === "profile" ? "profile" : "submissions";

  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);
  const [founderProfile, setFounderProfile] = useState<StoredFounderProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user?.email) {
      setSubmissions([]);
      setHydrated(true);
      return;
    }

    const userEmail = user.email.trim().toLowerCase();
    let cancelled = false;

    const loadAccountSubmissions = async () => {
      const merged = new Map<string, StoredSubmission>();

      if (token) {
        try {
          const remote = await getMySubmissions(token);
          for (const item of remote) {
            merged.set(item.tool_slug || item.id, {
              id: item.id,
              tool_name: item.tool_name,
              tool_slug: item.tool_slug,
              submission_type: "standard",
              owner_email: userEmail,
              status: item.status,
              website_url: item.website_url || undefined,
              submitted_at: item.submitted_at || new Date().toISOString(),
            });
          }
        } catch {
          // Fallback to account-scoped localStorage entries
        }
      }

      try {
        const rawSubs = localStorage.getItem(SUBMITTED_TOOLS_STORAGE_KEY);
        if (rawSubs) {
          const parsed = JSON.parse(rawSubs);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (!item || (item.owner_email || "").toLowerCase() !== userEmail) continue;
              const key = item.tool_slug || item.id;
              if (!merged.has(key)) merged.set(key, item);
            }
          }
        }

        const rawProfile = localStorage.getItem("aitoolsfinder_founder_profile");
        if (rawProfile) {
          setFounderProfile(JSON.parse(rawProfile));
        }
      } catch {
        // Ignore malformed localStorage entries
      }

      if (!cancelled) {
        setSubmissions(Array.from(merged.values()));
        setHydrated(true);
      }
    };

    loadAccountSubmissions();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user, token]);

  const handleTabChange = (nextTab: "submissions" | "profile") => {
    router.replace(`/dashboard?tab=${nextTab}`, { scroll: false });
  };

  const handleCopyCli = async () => {
    try {
      await navigator.clipboard.writeText("npx aitoolsfinder-submit");
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <PageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Dashboard" },
      ]}
      containerClassName="max-w-5xl py-4 sm:py-8"
    >
      {/* Header & Tabs */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-border/80 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
            Founder Workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {activeTab === "submissions"
              ? "Submitted Tools / SaaS"
              : "Founder Profile"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeTab === "submissions"
              ? "Track your submitted AI products, editorial review status, and live directory backlinks."
              : "Manage your verified founder identity and public attribution links."}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="inline-flex rounded-xl border border-border bg-surface-1 p-1 self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "submissions"}
            onClick={() => handleTabChange("submissions")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "submissions"
                ? "bg-primary/20 text-foreground border border-primary/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5 text-accent" />
            <span>Submitted Tools</span>
            {hydrated && submissions.length > 0 && (
              <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                {submissions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "profile"}
            onClick={() => handleTabChange("profile")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "profile"
                ? "bg-primary/20 text-foreground border border-primary/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-3.5 w-3.5 text-primary-content" />
            <span>Founder Profile</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "submissions" ? (
        <section aria-label="Submitted tools and SaaS" className="mt-8">
          {!hydrated || authLoading ? (
            <div className="h-64 rounded-3xl border border-border bg-surface-1/60 animate-pulse" />
          ) : !isAuthenticated ? (
            <div className="rounded-3xl border border-border bg-surface-1/80 p-8 text-center">
              <h2 className="text-xl font-semibold text-foreground">Sign in to view your submitted tools</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Submissions are private to your account. Sign in with your email to view and track your products.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/login">
                  <Button variant="primary" size="md">
                    Sign in to your account
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : submissions.length > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {submissions.length}{" "}
                  {submissions.length === 1 ? "submission" : "submissions"} from this browser.
                </p>
                <Link href="/submit">
                  <Button variant="primary" size="sm">
                    Submit another tool
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {submissions.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-surface-1/80 p-5 backdrop-blur-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">
                            {item.tool_name}
                          </h2>
                          {item.website_url && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span className="truncate max-w-[240px]">
                                {item.website_url}
                              </span>
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {item.submission_type === "featured"
                            ? "Fast-Track"
                            : "Standard"}
                        </Badge>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs text-accent">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Under Editorial Review</span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-subtle-foreground">
                      <span className="font-mono">
                        {item.tool_slug ? `/tools/${item.tool_slug}` : `ID: ${item.id.slice(0, 8)}`}
                      </span>
                      {item.tool_slug && (
                        <Link
                          href={`/tools/${item.tool_slug}`}
                          className="inline-flex items-center gap-1 font-medium text-primary-content hover:text-foreground"
                        >
                          <span>Preview</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty State: Conversion-Focused Lure for Founders */
            <div className="relative overflow-hidden rounded-3xl border border-primary/35 bg-gradient-to-b from-surface-1 via-surface-1/95 to-surface-2 p-6 sm:p-10 shadow-[0_24px_80px_-28px_rgba(112,34,252,0.3)]">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr_0.95fr] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    <FolderGit2 className="h-3.5 w-3.5" />
                    <span>0 Tools Submitted Yet</span>
                  </div>

                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                    You haven&apos;t submitted a tool yet. Your competitors are already getting shortlisted.
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Every day your AI tool or SaaS stays off AIToolsFinder, buyers comparing your category see alternatives first—and you leave a permanent, free dofollow backlink on the table. Claim your listing in 90 seconds before someone else owns your category slot.
                  </p>

                  <div className="mt-6 space-y-3">
                    {VALUE_PILLARS.map((pillar) => {
                      const Icon = pillar.icon;
                      return (
                        <div
                          key={pillar.title}
                          className="flex items-start gap-3 rounded-2xl border border-white/5 bg-background/50 p-3.5 backdrop-blur-sm"
                        >
                          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${pillar.accent}`} />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {pillar.title}
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                              {pillar.detail}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link href="/submit">
                      <Button variant="primary" size="md">
                        <span>Submit Your SaaS Free</span>
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/vendor">
                      <Button variant="outline" size="md">
                        <BadgeCheck className="mr-1.5 h-4 w-4 text-accent" />
                        <span>Already listed? Claim it</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 5-Second CLI Fast-Lane Card */}
                <div className="rounded-2xl border border-white/15 bg-[#09080e]/95 p-5 sm:p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      <Terminal className="h-3.5 w-3.5 text-accent" />
                      <span>5-Second CLI Fast-Lane</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      100% Free
                    </span>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    Shipping in Cursor, Claude Code, or your terminal? Skip the form and submit directly from your project folder:
                  </p>

                  <div className="mt-3 flex items-center justify-between rounded-xl border border-accent/40 bg-black/90 p-3">
                    <div className="flex items-center gap-2 overflow-x-auto font-mono text-xs sm:text-sm">
                      <span className="font-bold text-accent select-none">$</span>
                      <code className="font-semibold text-white">
                        npx aitoolsfinder-submit
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCli}
                      className="ml-2 shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-accent/20 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-black transition-colors"
                      title="Copy command"
                    >
                      {copiedCli ? (
                        <>
                          <CheckCheck className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <ul className="mt-4 space-y-2 rounded-xl border border-white/5 bg-surface-2/60 p-3.5 font-mono text-[11px] text-zinc-300">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>Auto-detects repo title, tagline &amp; URL</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>Permanent dofollow backlink queued immediately</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>Verified trust badge ready for your README</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        /* Founder Profile Tab */
        <section aria-label="Founder profile" className="mt-8">
          <div className="rounded-3xl border border-border bg-surface-1/80 p-6 sm:p-8 backdrop-blur-md">
            {founderProfile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {founderProfile.founder_name}
                    </h2>
                    <p className="text-xs font-mono text-primary-content">
                      @{founderProfile.handle}
                    </p>
                  </div>
                  {founderProfile.is_verified && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                      Verified Founder
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">
                  {founderProfile.headline}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {founderProfile.bio}
                </p>
                <div className="pt-2">
                  <Link href="/onboarding">
                    <Button variant="outline" size="sm">
                      Edit Founder Profile
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="max-w-xl">
                <h2 className="text-xl font-semibold text-foreground">
                  {isAuthenticated && user
                    ? `Signed in as ${user.email}`
                    : "Complete your Founder Profile"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Verify your builder identity with GitHub, X, or LinkedIn to attach founder attribution to your tool listings and speed up review.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/onboarding">
                    <Button variant="primary" size="md">
                      Set up Founder Profile
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/submit">
                    <Button variant="outline" size="md">
                      Submit a Tool
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </PageShell>
  );
}
