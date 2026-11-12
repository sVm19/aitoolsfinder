"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, CircleHelp, Minus, X } from "lucide-react";
import type {
  CatalogPricingPlan,
  ComparisonFeatureRow,
  ComparisonMatrix,
} from "@/lib/catalog-api";

interface ComparisonMatrixViewProps {
  comparison: ComparisonMatrix;
  compact?: boolean;
}

type SupportLevel = "yes" | "partial" | "no" | "unknown";

function supportLevel(value: string | undefined): SupportLevel {
  return value === "yes" || value === "partial" || value === "no"
    ? value
    : "unknown";
}

function supportLabel(value: SupportLevel): string {
  return {
    yes: "Supported",
    partial: "Partially supported",
    no: "Not supported",
    unknown: "Unknown",
  }[value];
}

function SupportValue({ value }: { value: SupportLevel }) {
  const Icon =
    value === "yes" ? Check : value === "partial" ? Minus : value === "no" ? X : CircleHelp;
  const tone =
    value === "yes"
      ? "text-emerald-300"
      : value === "partial"
        ? "text-amber-200"
        : value === "no"
          ? "text-rose-300"
          : "text-muted-foreground";

  return (
    <span className={`inline-flex items-center gap-2 text-sm ${tone}`}>
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{supportLabel(value)}</span>
    </span>
  );
}

function differs(values: string[]): boolean {
  return new Set(values).size > 1;
}

function pricingModelLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function planPrice(plan: CatalogPricingPlan): string {
  if (plan.is_free) return "Free";
  if (plan.amount_minor === null) return "Price not listed";
  const currency = plan.currency ?? "USD";
  try {
    const fractionDigits = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      plan.amount_minor / 10 ** fractionDigits,
    );
  } catch {
    return `${(plan.amount_minor / 100).toFixed(2)} ${currency}`;
  }
}

function pricingSignature(plans: CatalogPricingPlan[]): string {
  return plans
    .map((plan) => `${plan.name}:${planPrice(plan)}:${plan.billing_interval}`)
    .sort()
    .join("|");
}

function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function apiAccessFeature(features: ComparisonFeatureRow[]): ComparisonFeatureRow | undefined {
  return features.find(
    (feature) =>
      /(^|[-_ ])api([-_ ]|$)/i.test(feature.slug) ||
      /\bapi\b/i.test(feature.name),
  );
}

export function ComparisonMatrixView({
  comparison,
  compact = false,
}: ComparisonMatrixViewProps) {
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const apiFeature = useMemo(
    () => apiAccessFeature(comparison.features),
    [comparison.features],
  );
  const featureRows = useMemo(
    () => {
      const filtered = comparison.features.filter((feature) => {
        if (!showOnlyDifferences) return true;
        return differs(
          comparison.tools.map((tool) =>
            supportLevel(feature.support_by_tool[tool.slug]),
          ),
        );
      });
      return compact ? filtered.slice(0, 4) : filtered;
    },
    [comparison.features, comparison.tools, showOnlyDifferences, compact],
  );
  const featuresByGroup = useMemo(() => {
    const groups = new Map<string, ComparisonFeatureRow[]>();
    for (const feature of featureRows) {
      const label = feature.feature_group || "Core features";
      groups.set(label, [...(groups.get(label) ?? []), feature]);
    }
    return [...groups.entries()];
  }, [featureRows]);

  const tableColumnCount = comparison.tools.length + 1;
  const apiValues = comparison.tools.map((tool) =>
    apiFeature
      ? supportLevel(apiFeature.support_by_tool[tool.slug])
      : "unknown",
  );
  const visibleSummaryRows = [
    {
      id: "pricing-model",
      label: "Pricing model",
      values: comparison.tools.map((tool) => pricingModelLabel(tool.pricing_model)),
      render: (index: number) => pricingModelLabel(comparison.tools[index].pricing_model),
    },
    {
      id: "api-access",
      label: "API availability",
      values: apiValues,
      render: (index: number) => <SupportValue value={apiValues[index]} />,
    },
    {
      id: "platform-status",
      label: "Platform status",
      values: comparison.tools.map((tool) => tool.platform_status),
      render: (index: number) => pricingModelLabel(comparison.tools[index].platform_status),
    },
    {
      id: "pricing-tiers",
      label: "Pricing tiers",
      values: comparison.tools.map((tool) =>
        pricingSignature(comparison.pricing_by_tool[tool.slug] ?? []),
      ),
      render: (index: number) => (
        <PricingPlans plans={comparison.pricing_by_tool[comparison.tools[index].slug] ?? []} />
      ),
    },
  ].filter((row) => {
    if (compact && row.id === "platform-status") return false;
    return !showOnlyDifferences || differs(row.values);
  });

  const visibleFeatureCount = featureRows.length;

  return (
    <section aria-labelledby="comparison-matrix-title" className="mt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
            Evidence matrix
          </p>
          <h2 id="comparison-matrix-title" className="mt-2 text-xl font-semibold text-foreground">
            {compact ? "Quick comparison" : "Features and pricing"}
          </h2>
        </div>
        {!compact && (
          <label className="inline-flex w-fit cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-foreground focus-within:ring-2 focus-within:ring-primary">
            <input
              type="checkbox"
              checked={showOnlyDifferences}
              onChange={(event) => setShowOnlyDifferences(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Show only differences
          </label>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {compact
          ? "A short sample of published feature and pricing data."
          : showOnlyDifferences
            ? `${visibleSummaryRows.length + visibleFeatureCount} differing rows shown.`
            : "Scroll horizontally to compare every tool on smaller screens."}
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" tabIndex={0} aria-label="Scrollable comparison matrix">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
          <caption className="sr-only">Feature, platform, and pricing comparison for {comparison.tools.map((tool) => tool.name).join(", ")}</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky top-0 left-0 z-30 w-48 border-b border-border bg-surface-2 px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Details
              </th>
              {comparison.tools.map((tool) => (
                <th key={tool.id} scope="col" className="sticky top-0 z-20 min-w-[220px] border-b border-l border-border bg-surface-2 px-4 py-4 align-top">
                  <Link href={`/tools/${encodeURIComponent(tool.slug)}`} className="rounded-sm text-base font-semibold text-foreground underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    {tool.name}
                  </Link>
                  {tool.primary_category && (
                    <span className="mt-2 block text-xs font-normal text-muted-foreground">
                      {tool.primary_category.name}
                    </span>
                  )}
                  {tool.is_verified && (
                    <span className="mt-3 inline-flex rounded-full border border-primary/35 bg-primary/15 px-2 py-1 text-xs font-medium text-primary-content">
                      Verified
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th colSpan={tableColumnCount} scope="colgroup" className="sticky left-0 border-b border-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary-content">
                Tool details
              </th>
            </tr>
            {visibleSummaryRows.map((row) => (
              <tr key={row.id} className="align-top">
                <th scope="row" className="sticky left-0 z-10 border-b border-border bg-surface-1 px-4 py-4 text-sm font-medium text-muted-foreground">
                  {row.label}
                </th>
                {comparison.tools.map((tool, index) => (
                  <td key={tool.id} className="border-b border-l border-border px-4 py-4 text-sm text-foreground">
                    {row.render(index)}
                  </td>
                ))}
              </tr>
            ))}

            {featuresByGroup.map(([group, rows]) => (
              <FeatureGroup
                key={group}
                group={group}
                rows={rows}
                tools={comparison.tools}
                columnCount={tableColumnCount}
              />
            ))}
            {featuresByGroup.length === 0 && !showOnlyDifferences && (
              <tr>
                <td colSpan={tableColumnCount} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No feature evidence has been published for this comparison.
                </td>
              </tr>
            )}
            {showOnlyDifferences && visibleSummaryRows.length + visibleFeatureCount === 0 && (
              <tr>
                <td colSpan={tableColumnCount} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No differences are available in the published data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-subtle-foreground">
        Feature status and prices reflect the data supplied to the catalog. Follow each tool’s official site to confirm current availability and terms.
      </p>
    </section>
  );
}

function FeatureGroup({
  group,
  rows,
  tools,
  columnCount,
}: {
  group: string;
  rows: ComparisonFeatureRow[];
  tools: ComparisonMatrix["tools"];
  columnCount: number;
}) {
  return (
    <>
      <tr>
        <th colSpan={columnCount} scope="colgroup" className="sticky left-0 border-b border-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary-content">
          {group}
        </th>
      </tr>
      {rows.map((feature) => (
        <tr key={feature.feature_id} className="align-top transition-colors hover:bg-surface-2/70">
          <th scope="row" className="sticky left-0 z-10 border-b border-border bg-surface-1 px-4 py-4 text-sm font-medium text-foreground">
            {feature.name}
          </th>
          {tools.map((tool) => (
            <td key={tool.id} className="border-b border-l border-border px-4 py-4">
              <SupportValue value={supportLevel(feature.support_by_tool[tool.slug])} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function PricingPlans({ plans }: { plans: CatalogPricingPlan[] }) {
  if (plans.length === 0) {
    return <span className="text-muted-foreground">No pricing tiers listed</span>;
  }
  return (
    <ul className="space-y-3">
      {plans.map((plan) => (
        <li key={plan.id}>
          {safeHttpUrl(plan.pricing_url || plan.source_url) ? (
            <a
              href={safeHttpUrl(plan.pricing_url || plan.source_url)!}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="block font-medium text-foreground underline decoration-primary/50 underline-offset-4 hover:text-primary-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {plan.name}
            </a>
          ) : (
            <span className="block font-medium text-foreground">{plan.name}</span>
          )}
          <span className="mt-0.5 block text-muted-foreground">
            {planPrice(plan)} {plan.is_free ? "" : intervalLabel(plan.billing_interval)}
          </span>
        </li>
      ))}
    </ul>
  );
}
