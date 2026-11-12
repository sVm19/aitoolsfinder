import Link from "next/link";
import { ToolCard } from "@/components/tool/tool-card";
import { EmptyState } from "@/components/ui/empty-state";
import { toToolCardData } from "@/lib/catalog-presentation";
import type { CatalogCategory, CatalogTool } from "@/lib/catalog-api";

interface CatalogToolGridProps {
  tools: CatalogTool[];
  categories: CatalogCategory[];
  total: number;
  page: number;
  totalPages: number;
  basePath: string;
}

export function CatalogToolGrid({
  tools,
  categories,
  total,
  page,
  totalPages,
  basePath,
}: CatalogToolGridProps) {
  return (
    <section aria-labelledby="catalog-tools-title" className="mt-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="catalog-tools-title" className="text-xl font-semibold text-foreground">Published tools</h2>
          <p className="mt-1 text-sm text-muted-foreground">{total} {total === 1 ? "tool" : "tools"}</p>
        </div>
      </div>
      {tools.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={toToolCardData(tool, categories)} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav aria-label="Tool pages" className="mt-8 flex items-center justify-between border-t border-border/70 pt-5">
              {page > 1 ? (
                <Link href={`${basePath}?page=${page - 1}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm text-foreground hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  Previous
                </Link>
              ) : <span />}
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              {page < totalPages ? (
                <Link href={`${basePath}?page=${page + 1}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm text-foreground hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  Next
                </Link>
              ) : <span />}
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          title="No published tools yet"
          description="There are no published catalog entries for this page yet."
        />
      )}
    </section>
  );
}
