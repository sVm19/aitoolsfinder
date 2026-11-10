# SEO Strategy

## 1. SEO objective
Acquire relevant organic traffic through useful tool, category, comparison, alternative and editorial pages. Search visibility is earned through unique value, not page count alone.

## 2. Page types and URL patterns
- `/tools/{slug}`
- `/categories/{slug}`
- `/tags/{slug}`
- `/compare/{slug}`
- `/alternatives/{slug}`
- `/rankings/{slug}`
- `/blog/{slug}`

Use lowercase, stable, human-readable slugs. Avoid changing published URLs without redirects.

## 3. On-page requirements
Every indexable page should have:
- Unique title and meta description
- One clear H1
- Useful original page content
- Canonical URL
- Breadcrumbs
- Descriptive internal links
- Open Graph metadata
- Appropriate structured data where eligible
- Last-updated or verified information where meaningful

## 4. Structured data
Use only schema types that accurately describe page content. Potential types include Organization, WebSite, BreadcrumbList, Article and SoftwareApplication where requirements are met. Do not add fabricated ratings, offers or reviews.

## 5. Programmatic SEO safeguards
- Do not index empty category/tag pages.
- Do not index arbitrary filter combinations by default.
- Do not create near-duplicate comparison pages.
- No mass-generated thin pages.
- Each page must have unique information and a useful purpose.
- Use `noindex` for low-value internal search pages where appropriate.
- Maintain XML sitemaps by content type.

## 6. Internal linking
Connect:
- Tool ↔ category
- Tool ↔ tags
- Tool ↔ alternatives
- Tool ↔ comparisons
- Category ↔ related categories
- Editorial article ↔ relevant tools

Use descriptive anchor text and avoid excessive exact-match repetition.

## 7. Technical SEO
- Server-render public content.
- Correct status codes and redirects.
- Canonical handling.
- robots.txt and XML sitemap.
- Avoid accidental indexing of staging/admin pages.
- Optimize image sizes and Core Web Vitals.
- Ensure pagination is crawlable where relevant.

## 8. Measurement
Use Google Search Console and analytics to monitor impressions, clicks, queries, indexing, landing-page performance and conversions. Do not treat rankings as guaranteed.
