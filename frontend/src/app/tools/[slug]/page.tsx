import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, CircleHelp, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { Badge } from "@/components/ui/badge";
import { CatalogApiError, getToolBySlug, type CatalogPricingPlan, type CatalogToolDetail } from "@/lib/catalog-api";
import { canonicalUrl } from "@/lib/site";

function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function pricingLabel(value: CatalogToolDetail["pricing_model"]): string {
  const labels: Record<CatalogToolDetail["pricing_model"], string> = {
    free: "Free",
    freemium: "Freemium",
    paid: "Paid",
    usage_based: "Usage based",
    contact_sales: "Contact sales",
    unknown: "Not listed",
  };
  return labels[value];
}

function intervalLabel(value: CatalogPricingPlan["billing_interval"]): string {
  const labels: Record<CatalogPricingPlan["billing_interval"], string> = {
    one_time: "one time",
    monthly: "per month",
    yearly: "per year",
    usage_based: "usage based",
    unknown: "interval not listed",
  };
  return labels[value];
}

function formatPrice(plan: CatalogPricingPlan): string {
  if (plan.is_free) return "Free";
  if (plan.amount_minor === null) return "Price not listed";
  const currency = plan.currency ?? "USD";
  const fractionDigits = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits ?? 2;
  const amount = plan.amount_minor / 10 ** fractionDigits;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function dateLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function hasUsefulContent(tool: CatalogToolDetail): boolean {
  return Boolean(
    tool.tagline?.trim() ||
      tool.description?.trim() ||
      tool.features.length ||
      tool.pricing_plans.length,
  );
}

function buildSoftwareApplicationJsonLd(tool: CatalogToolDetail) {
  const websiteUrl = safeHttpUrl(tool.website_url);
  const offers = tool.pricing_plans
    .filter((plan) => plan.is_free || plan.amount_minor !== null)
    .map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.is_free
        ? "0"
        : (plan.amount_minor! / 10 ** (new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: plan.currency ?? "USD",
          }).resolvedOptions().maximumFractionDigits ?? 2)).toString(),
      priceCurrency: plan.currency ?? "USD",
      ...(safeHttpUrl(plan.pricing_url) ? { url: safeHttpUrl(plan.pricing_url) } : {}),
    }));
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    ...(websiteUrl ? { url: websiteUrl } : {}),
    ...(tool.tagline || tool.description
      ? { description: tool.description || tool.tagline }
      : {}),
    ...(tool.primary_category?.name
      ? { applicationCategory: tool.primary_category.name }
      : {}),
    ...(offers.length ? { offers } : {}),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function ProfileSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-border/70 py-8 sm:py-10">
      <h2 id={id} className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tool = await getToolBySlug(slug);
    const title = `${tool.name} — AI Tool Profile`;
    const description =
      tool.tagline ||
      tool.description?.slice(0, 155) ||
      `Published product details, features, and pricing for ${tool.name}.`;
    const url = canonicalUrl(`/tools/${encodeURIComponent(tool.slug)}`);
    return {
      title,
      description,
      alternates: { canonical: url },
      robots: { index: hasUsefulContent(tool), follow: true },
      openGraph: {
        title,
        description,
        url,
        type: "website",
        images: [
          {
            url: canonicalUrl(`/tools/${encodeURIComponent(tool.slug)}/opengraph-image`),
            width: 1200,
            height: 630,
            alt: `${tool.name} profile on AIToolsFinder`,
          },
        ],
      },
      twitter: { card: "summary", title, description },
    };
  } catch {
    return { title: "AI Tool Profile", robots: { index: false, follow: true } };
  }
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let tool: CatalogToolDetail;
  try {
    tool = await getToolBySlug(slug);
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) notFound();
    return (
      <PublicErrorPage
        title="Tool details are temporarily unavailable"
        description="We couldn't load this published tool profile. Try again in a moment."
      />
    );
  }

  const websiteUrl = safeHttpUrl(tool.website_url);
  const sourceLinks = [
    { label: "Official product website", url: websiteUrl },
    ...tool.pricing_plans.map((plan) => ({
      label: `${plan.name} pricing source`,
      url: safeHttpUrl(plan.source_url) ?? safeHttpUrl(plan.pricing_url),
    })),
  ].filter((source): source is { label: string; url: string } => Boolean(source.url));
  const category = tool.primary_category;
  const updatedAt = dateLabel(tool.updated_at);
  const verifiedAt = dateLabel(tool.last_verified_at);
  const jsonLd = buildSoftwareApplicationJsonLd(tool);
  const breadcrumbItems = category
    ? ([
        { label: "Home", href: "/" },
        { label: "Categories", href: "/categories" },
        { label: category.name, href: `/categories/${category.slug}` },
        { label: tool.name },
      ] as const)
    : ([
        { label: "Home", href: "/" },
        { label: "Explore", href: "/explore" },
        { label: tool.name },
      ] as const);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs items={breadcrumbItems} className="mb-8" />

          <header className="border-b border-border/70 pb-8 sm:pb-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-primary-content">
                  <Sparkles aria-hidden="true" className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{tool.name}</h1>
                    {tool.is_verified && <Badge variant="verified"><Check aria-hidden="true" className="h-3.5 w-3.5" />Verified</Badge>}
                    {tool.is_sponsored && <Badge variant="sponsored">Sponsored</Badge>}
                  </div>
                  {tool.tagline && <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{tool.tagline}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {category && <Link href={`/categories/${category.slug}`} prefetch={false} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{category.name}</Link>}
                    {tool.tags.map((tag) => <Link key={tag.id} href={`/tags/${tag.slug}`} prefetch={false} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{tag.name}</Link>)}
                  </div>
                </div>
              </div>
              {websiteUrl ? (
                <a href={websiteUrl} target="_blank" rel="nofollow noopener noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  Visit official website
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </a>
              ) : <span className="text-sm text-muted-foreground">Official website unavailable</span>}
            </div>
          </header>

          <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-border bg-surface-1 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-content">At a glance</p>
                <dl className="mt-4 divide-y divide-border/70 text-sm">
                  <div className="flex items-start justify-between gap-3 py-3 first:pt-0"><dt className="text-muted-foreground">Pricing</dt><dd className="text-right font-medium text-foreground">{pricingLabel(tool.pricing_model)}</dd></div>
                  <div className="flex items-start justify-between gap-3 py-3"><dt className="text-muted-foreground">Verification</dt><dd className="text-right font-medium text-foreground">{tool.is_verified ? "Verified" : "Not verified"}</dd></div>
                  {tool.launched_at && <div className="flex items-start justify-between gap-3 py-3"><dt className="text-muted-foreground">Launched</dt><dd className="text-right font-medium text-foreground">{dateLabel(tool.launched_at)}</dd></div>}
                  <div className="flex items-start justify-between gap-3 py-3 last:pb-0"><dt className="text-muted-foreground">Plans listed</dt><dd className="text-right font-medium text-foreground">{tool.pricing_plans.length || "None"}</dd></div>
                </dl>
              </div>
            </aside>
            <div className="min-w-0">
              <ProfileSection id="overview-title" title="Overview">
                {tool.description ? (
                  <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-muted-foreground">{tool.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No product overview has been published yet.</p>
                )}
              </ProfileSection>

              <ProfileSection id="features-title" title="Key features">
                {tool.features.length ? (
                  <ul className="divide-y divide-border/70">
                    {tool.features.map((item) => (
                      <li key={item.feature.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">{item.feature.name}</h3>
                          {item.feature.description && <p className="mt-1 text-sm text-muted-foreground">{item.feature.description}</p>}
                          {item.notes && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.notes}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={item.support_level === "yes" ? "verified" : "outline"}>{item.support_level}</Badge>
                          {safeHttpUrl(item.evidence_url) && <a href={safeHttpUrl(item.evidence_url)!} target="_blank" rel="nofollow noopener noreferrer" className="text-xs text-primary-content underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Evidence</a>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">No feature details have been published for this tool.</p>}
              </ProfileSection>

              <ProfileSection id="fit-title" title="Use cases and audience fit">
                <p className="text-sm text-muted-foreground">Use-case guidance has not been published for this tool yet.</p>
              </ProfileSection>

              <ProfileSection id="pricing-title" title="Pricing plans">
                {tool.pricing_plans.length ? (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                      <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr><th scope="col" className="px-4 py-3">Plan</th><th scope="col" className="px-4 py-3">Price</th><th scope="col" className="px-4 py-3">Details</th><th scope="col" className="px-4 py-3">Source</th></tr>
                      </thead>
                      <tbody className="divide-y divide-border/70">
                        {tool.pricing_plans.map((plan) => {
                          const source = safeHttpUrl(plan.source_url) ?? safeHttpUrl(plan.pricing_url);
                          const limitations = Object.entries(plan.limitations ?? {}).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value));
                          return (
                            <tr key={plan.id} className="align-top">
                              <th scope="row" className="px-4 py-4 font-medium text-foreground">{plan.name}{plan.description && <span className="mt-1 block max-w-xs text-xs font-normal leading-relaxed text-muted-foreground">{plan.description}</span>}</th>
                              <td className="whitespace-nowrap px-4 py-4 text-foreground">{formatPrice(plan)}{!plan.is_free && plan.amount_minor !== null && <span className="block text-xs text-muted-foreground">{intervalLabel(plan.billing_interval)}</span>}</td>
                              <td className="px-4 py-4 text-muted-foreground">{limitations.length ? <ul className="space-y-1">{limitations.map(([key, value]) => <li key={key}>{key.replaceAll("_", " ")}: {String(value)}</li>)}</ul> : "No plan limits listed."}</td>
                              <td className="px-4 py-4">{source ? <a href={source} target="_blank" rel="nofollow noopener noreferrer" className="text-xs text-primary-content underline-offset-4 hover:underline">View source</a> : <span className="text-xs text-subtle-foreground">Not supplied</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No plan-level pricing has been published. The listed pricing model is {pricingLabel(tool.pricing_model).toLowerCase()}.</p>
                )}
              </ProfileSection>

              <ProfileSection id="score-title" title="Intelligence score and methodology">
                <p className="text-sm text-muted-foreground">No public score has been published for this tool.</p>
              </ProfileSection>

              <ProfileSection id="alternatives-title" title="Alternatives">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">Review curated and related alternatives using published catalog details.</p>
                  <Link href={`/alternatives/${encodeURIComponent(tool.slug)}`} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    Explore alternatives <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </ProfileSection>

              <ProfileSection id="comparisons-title" title="Comparisons">
                <p className="text-sm text-muted-foreground">No published comparisons include this tool yet.</p>
              </ProfileSection>

              <ProfileSection id="reviews-title" title="Reviews">
                <p className="text-sm text-muted-foreground">No reviews have been published for this tool.</p>
              </ProfileSection>

              <ProfileSection id="faq-title" title="Frequently asked questions">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CircleHelp aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-subtle-foreground" />
                  <p>
                    No product-specific FAQ has been published yet. {websiteUrl ? (
                      <>Check the <a href={websiteUrl} target="_blank" rel="nofollow noopener noreferrer" className="text-primary-content underline-offset-4 hover:underline">official product site</a> for current details.</>
                    ) : "An official product URL is not available."}
                  </p>
                </div>
              </ProfileSection>

              <ProfileSection id="sources-title" title="Data sources and verification">
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>Catalog record updated: {updatedAt ?? "date not available"}.</p>
                  <p>Tool last verified: {verifiedAt ?? "not recorded"}.</p>
                  {sourceLinks.length ? (
                    <ul className="space-y-2">
                      {sourceLinks.map((source) => <li key={`${source.label}-${source.url}`}><a href={source.url} target="_blank" rel="nofollow noopener noreferrer" className="text-primary-content underline-offset-4 hover:underline">{source.label}<ArrowUpRight aria-hidden="true" className="ml-1 inline h-3.5 w-3.5" /></a></li>)}
                    </ul>
                  ) : <p>No source URLs have been supplied.</p>}
                </div>
              </ProfileSection>
            </div>

          </div>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </div>
  );
}

function PublicErrorPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
        <section role="alert" className="w-full rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
