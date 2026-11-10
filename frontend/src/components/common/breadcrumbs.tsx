import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { canonicalUrl } from "@/lib/site";

export interface BreadcrumbLinkItem {
  label: string;
  href: `/${string}`;
}

export interface BreadcrumbCurrentItem {
  label: string;
  href?: never;
}

export type BreadcrumbItems = readonly [
  ...BreadcrumbLinkItem[],
  BreadcrumbCurrentItem,
];

interface BreadcrumbsProps {
  items: BreadcrumbItems;
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: canonicalUrl(item.href) } : {}),
    })),
  };
  const jsonLd = JSON.stringify(breadcrumbList).replace(/</g, "\\u003c");

  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {items.map((item, index) => {
            const isCurrent = index === items.length - 1;

            return (
              <li
                key={`${item.label}-${index}`}
                className="inline-flex items-center gap-2"
              >
                {index > 0 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-subtle-foreground"
                  />
                )}
                {item.href && !isCurrent ? (
                  <Link
                    href={item.href}
                    className="rounded-sm text-subtle-foreground transition-colors hover:text-primary-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isCurrent ? "page" : undefined}
                    className={isCurrent ? "font-medium text-foreground" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
    </>
  );
}
