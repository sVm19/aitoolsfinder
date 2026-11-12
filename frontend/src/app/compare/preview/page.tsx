import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
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
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs
              className="mb-8"
              items={[
                { label: "Home", href: "/" },
                { label: "Comparison preview" },
              ]}
            />
            <header className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
                Temporary comparison
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Compare your selected tools
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                This preview uses the published catalog data and is not saved as a public comparison.
              </p>
            </header>
            <ComparisonMatrixView comparison={comparison} />
          </div>
        </main>
        <Footer />
      </div>
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
        <ErrorState
          className="w-full"
          title={title}
          description={description}
          action={
            <Link
              href="/explore"
              className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Explore published tools
            </Link>
          }
        />
      </main>
      <Footer />
    </div>
  );
}
