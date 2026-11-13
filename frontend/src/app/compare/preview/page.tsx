import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/common/page-shell";
import { ComparisonMatrixView } from "@/components/comparison/comparison-matrix";
import { ErrorState } from "@/components/ui/error-state";
import { CatalogApiError, previewComparison } from "@/lib/catalog-api";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Comparison preview",
  description: "A temporary comparison of selected published AI tools.",
  robots: { index: false, follow: true },
};

function selectedSlugs(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((slug) => slug.trim()).filter(Boolean))];
}

export default async function ComparisonPreviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const slugs = selectedSlugs(params.tool);

  if (slugs.length < 2 || slugs.length > 4) {
    return (
      <PreviewState
        title="Choose two to four tools to compare"
        description="Return to Explore and add at least two published tools to the compare tray."
      />
    );
  }

  try {
    const comparison = await previewComparison(slugs);
    return (
      <PageShell
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Comparison preview" },
        ]}
      >
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
            Side-by-side analysis
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Compare your selected tools
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            This preview compares published features, pricing tiers, and benchmark ratings side by side.
          </p>
        </header>
        <div className="mt-8">
          <ComparisonMatrixView comparison={comparison} />
        </div>
      </PageShell>
    );
  } catch (error) {
    const unavailable = error instanceof CatalogApiError && error.status === 404;
    return (
      <PreviewState
        title={unavailable ? "A selected tool is no longer available" : "Comparison preview is temporarily unavailable"}
        description={
          unavailable
            ? "One or more selected tools are no longer published. Return to Explore and choose from the current catalog."
            : "We couldn't load the selected tools from the catalog. Try again in a moment."
        }
      />
    );
  }
}

function PreviewState({ title, description }: { title: string; description: string }) {
  return (
    <PageShell>
      <div className="py-12 max-w-2xl mx-auto">
        <ErrorState
          className="w-full"
          title={title}
          description={description}
          action={
            <Link
              href="/explore"
              className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Explore published tools
            </Link>
          }
        />
      </div>
    </PageShell>
  );
}
