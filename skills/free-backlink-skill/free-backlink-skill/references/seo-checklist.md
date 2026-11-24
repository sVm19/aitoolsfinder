# Modern Web SEO Checklist & Audit Standards

Use this checklist during **Phase 1 (Diagnosis)** and **Phase 2 (Automated Code Fixes)**.

---

## 1. Crawlability & Indexing Infrastructure
* [ ] **`robots.txt` / `robots.ts`:**
  * Must exist in `app/robots.ts` (Next.js 13+) or `public/robots.txt`.
  * Must point to `sitemap: https://yourdomain.com/sitemap.xml`.
  * Must disallow private paths (`/api/`, `/admin/`, `/dashboard/`).
  * Must explicitly allow search engine crawlers and legitimate AI answer crawlers (`GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`).
* [ ] **`sitemap.xml` / `sitemap.ts`:**
  * Must exist in `app/sitemap.ts` or `public/sitemap.xml`.
  * Must list all public canonical URLs with `lastModified`, `changeFrequency`, and `priority`.
  * Must never include 404, redirected, or `noindex` pages.

---

## 2. Document Head & Metadata
* [ ] **`metadataBase`:**
  * In Next.js App Router root `layout.tsx`, must specify `metadataBase: new URL("https://yourdomain.com")`.
  * Prevents broken relative social image links and Next.js compiler warnings.
* [ ] **Canonical URL:**
  * Root `layout.tsx` must specify `alternates: { canonical: '/' }`.
  * Prevents duplicate content index fragmentation across subdomains or trailing slashes.
* [ ] **Titles & Meta Descriptions:**
  * Title template: `"%s | BrandName"` or clear 50-60 character descriptive title.
  * Description: 120-155 characters focused on user job-to-be-done and high-intent keyword.
* [ ] **OpenGraph & Twitter Card:**
  * `openGraph: { title, description, url, siteName, locale: 'en_US', type: 'website' }`
  * `twitter: { card: 'summary_large_image', title, description }`

---

## 3. Schema.org JSON-LD (Rich Results)
* [ ] **SoftwareApplication / WebSite Schema:**
  * Must be present on the home/product page.
  * Injects structured metadata: `@type: "SoftwareApplication"`, `name`, `description`, `applicationCategory`, and `offers`.
* [ ] **BreadcrumbList Schema:**
  * Must be present on nested pages (`Home > Category > Product`).

---

## 4. AI Search & AEO/GEO Optimization
* [ ] **`public/llms.txt`:**
  * Must exist at the root of `public/llms.txt`.
  * Formatted in clean Markdown with H1 brand name, blockquote tagline, entity descriptions, core feature lists, and canonical markdown links.
  * Allows LLM web scrapers (ChatGPT, Perplexity, Claude) to ingest and cite the product with 100% factual accuracy.

---

## 5. On-Page Structure & Semantic HTML
* [ ] **One Single `<h1>` per page:** Clearly stating the core value proposition.
* [ ] **Logical Heading Hierarchy:** Proper cascading `<h2>`, `<h3>` without skipping levels.
* [ ] **Images with descriptive `alt` attributes:** Prevents accessibility failures and unlocks Google Image Search traffic.
