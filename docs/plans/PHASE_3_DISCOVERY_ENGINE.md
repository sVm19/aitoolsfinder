# Implementation Plan — Phase 3: Discovery Engine & Search

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Database:** Full-Text Search + `pg_trgm` (Supabase)  
**Status:** In Progress (Phase 1 & 2 are complete)  
**Exit Criteria:** Visitor can search and filter the published catalog in under 60 seconds; SEO landing pages render server-side with structured data.

---

## 1. Objectives & Scope

Phase 3 implements the public-facing discovery mechanics of `https://aitoolsfinder.cloud`. It provides fast, typo-tolerant full-text search, multi-faceted filtering, and complete SEO-optimized landing pages for tools, categories, and tags.

### In Scope
1. **Full-Text Search (FTS) & Trigrams:**
   - Generated `tsvector` column combining tool title (weight A), tagline (weight B), description (weight C), and primary category name (weight B).
   - GIN index for sub-10ms search queries.
   - Trigram similarity (`pg_trgm`) for typo tolerance and autocomplete suggestions.
2. **Catalog Search API (`GET /api/v1/tools` & `GET /api/v1/search`):**
   - Filters: query string (`q`), category slug (`category`), tag slugs (`tags`), pricing model (`pricing_model`), verified status (`is_verified`).
   - Sorting: relevance, `newest`, and `alphabetical`. Trending and highest-rated sorts need engagement and rating data that are not present in the catalog yet.
   - Cursor-based or bounded offset pagination (`page`, `page_size` max 100).
3. **Public Discovery Pages (Next.js App Router SSR):**
   - `/explore`: Filterable search engine with URL-synchronized state.
   - `/categories`: Master taxonomy overview grouping 40+ categories.
   - `/categories/[slug]`: High-value category landing page with custom H1, description, and tools list.
   - `/tags/[slug]`: Tag listing page.
   - `/tools/[slug]`: Complete tool profile page adhering to the 14-section order in `docs/UI_UX_GUIDELINES.md`.
4. **SEO & Structured Data:**
   - Server-side rendering (SSR) for all discovery pages.
   - Schema.org JSON-LD structured data (`SoftwareApplication`, `BreadcrumbList`, `Organization`).
   - Dynamic canonical tags pointing to `https://aitoolsfinder.cloud`.
   - Automated `noindex, follow` on empty search/filter queries to prevent index bloat.

---

## 2. Page & URL Architecture

```text
/explore?q=seo&category=marketing&pricing_model=freemium
    │
    ├── /categories/marketing
    │       └── /tools/jasper-ai
    │
    └── /tags/ai-video-generator
            └── /tools/runway
```

---

## 3. Step-by-Step Task Checklist

### Subphase Breakdown

Phase 3 is divided into six subphases matching the existing work items. This keeps the database, API, and page work independently reviewable without splitting them into extra layers:

1. **Search index:** weighted Supabase search vector, update triggers, GIN and trigram indexes.
2. **Discovery API:** published-tool filters, search ranking, sorting, pagination, and autocomplete.
3. **Explore:** responsive search and filters synchronized with the URL.
4. **Taxonomy pages:** category directory, category details, and tag details.
5. **Tool profile:** server-rendered profile, pricing, metadata, and structured data.
6. **SEO verification:** canonicals, empty-query indexing rules, sitemap coverage, and final checks.

### Progress

- **Subphase 1 — Search index:** Added a reversible Alembic migration and ORM mapping for weighted English `tsvector` search across tool name, tagline, description, and primary category. A GIN index supports full-text queries; a trigram GIN index supports fuzzy name matching. Triggers keep vectors current on tool edits and category renames. Alembic successfully generated offline SQL for the full migration chain. The migration has not been applied to a running Supabase database in this environment.
- **Subphase 2 — Discovery API:** Extended the existing catalog service/repository and public routes with FTS plus trigram fallback, category/tag/pricing/verification filters, relevance/newest/alphabetical sorting, bounded pagination, `/search`, and name autocomplete. Reused the existing paginated response envelope. Trending and highest-rated sorts remain deferred until their source metrics exist. Python compilation and Ruff pass; OpenAPI confirms all three public discovery routes. Supabase-backed query execution remains unverified because no database is running here.
- **Subphase 3 — Explore page:** Added the server-rendered `/explore` page with URL-synced debounced search, multi-category checkboxes, pricing and verified filters, sorting, pagination, skeleton/empty/error states, and shared navigation/footer. Search pages are canonicalized and `noindex, follow`. Production browser checks passed at 375, 768, and 1280px with no horizontal overflow or browser errors; the mobile menu and debounced search URL update worked. The catalog API is unavailable locally, so the error state appeared during the browser pass instead of real result cards.
- **Subphase 4 — Category and tag pages:** Added the category directory, category landing pages, and tag landing pages with server-rendered catalog data, dynamic titles/descriptions/canonicals, breadcrumb structured data, pagination, and `noindex, follow` for empty listings. Added the documented public tag-by-slug API route. Frontend build/typecheck, backend Ruff/compilation, and OpenAPI route registration pass. Browser checks at 375, 768, and 1280px passed without overflow/errors; the local API was unavailable, so populated listing/indexability behavior has not yet been verified against live catalog records.
- **Subphase 5 — Tool profile:** Added `/tools/[slug]` with the documented profile order, sourced feature evidence and pricing plans, safe external links, dynamic metadata/canonical, breadcrumbs, and `SoftwareApplication` JSON-LD without ratings. Public detail lookup now filters to published tools and eager-loads feature records. Thin profiles are `noindex`. TypeScript, production build, backend Ruff/compilation, and OpenAPI checks pass; browser widths 375/768/1280 show no overflow or page errors. The API was unavailable, so only the `noindex` error path was exercised. Click tracking remains with the planned outbound endpoint in Phase 7; the current official-site links use `nofollow noopener noreferrer`.
- **Subphase 6 — SEO verification:** Added a generated per-tool Open Graph PNG and a paginated sitemap sourced from active categories and published tools. Typecheck/build pass; production HTTP check returns `image/png` for the image route and valid XML for `/sitemap.xml`. With the catalog API unavailable, the sitemap currently contains only `/`; populated sitemap coverage and rendered tool canonical/metadata checks remain pending API-backed verification. The image route uses the Edge runtime because Next's Node image renderer resolves its bundled font incorrectly on Windows.

- [x] **Task 3.1: Supabase FTS Vector Migration**
  - [x] Add Alembic migration adding `search_vector tsvector` column to `tools`.
  - [x] Create triggers updating the vector on tool changes and category-name edits.
  - [x] Create GIN index on `search_vector`.
  - [x] Ensure `pg_trgm` is enabled and add a trigram index for fuzzy name matching.

- [x] **Task 3.2: Backend Discovery Query Engine (`backend/src/modules/catalog/`)**
  - [x] Implement dynamic query builder applying filters, search vector ranking (`ts_rank_cd`), and pagination.
  - [x] Extend `/api/v1/tools` and add `/api/v1/search` with the standard paginated envelope.
  - [x] Implement `/api/v1/search/autocomplete` for name suggestions.

- [x] **Task 3.3: Explore Page (`frontend/src/app/explore/page.tsx`)**
  - [x] Search input with debounced URL parameter updates.
  - [x] Faceted sidebar filter: Categories checkbox list, Pricing model pills, Verified toggle.
  - [x] Responsive tools grid with animated loading skeletons and empty states.

- [x] **Task 3.4: Category & Tag Pages**
  - [x] `frontend/src/app/categories/page.tsx`: Active taxonomy directory.
  - [x] `frontend/src/app/categories/[slug]/page.tsx`: Individual category landing with dynamic metadata.
  - [x] `frontend/src/app/tags/[slug]/page.tsx`: Tag landing page.

- [x] **Task 3.5: Comprehensive Tool Detail Page (`frontend/src/app/tools/[slug]/page.tsx`)**
  - [x] Server-render full tool profile from the published-only backend endpoint.
  - [x] Implement structured pricing plans table showing free tier vs. paid intervals.
  - [x] Implement JSON-LD `SoftwareApplication` markup without unsupported ratings.
  - [x] Use safe official and evidence links with `rel="nofollow noopener noreferrer"`; click tracking awaits the Phase 7 outbound endpoint.

- [ ] **Task 3.6: Technical SEO Verification**
  - [x] Generate and serve a per-tool Open Graph image (`image/png`).
  - [ ] Verify rendered OpenGraph metadata and canonical tag on a populated tool page; local catalog API is unavailable.
  - [ ] Verify `sitemap.xml` includes all published tools and active categories against live catalog data; local catalog API is unavailable.

---

## 4. Milestone Exit Criteria

1. Search queries return relevant tools in <100ms.
2. Filters (category, pricing model, verified) accurately filter catalog results without breaking URL state.
3. Every published tool page renders complete metadata, pricing breakdown, and valid JSON-LD.
4. Lighthouse SEO and Performance scores ≥ 90 on tool detail and category pages.
