# Implementation Plan — Phase 3: Discovery Engine & Search

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Database:** PostgreSQL Full-Text Search + `pg_trgm` (Supabase / Docker)  
**Status:** In Progress (Phase 1 & 2 are complete)  
**Exit Criteria:** Visitor can search and filter the published catalog in under 60 seconds; SEO landing pages render server-side with structured data.

---

## 1. Objectives & Scope

Phase 3 implements the public-facing discovery mechanics of `https://aitoolsfinder.cloud`. It provides fast, typo-tolerant full-text search, multi-faceted filtering, and complete SEO-optimized landing pages for tools, categories, and tags.

### In Scope
1. **PostgreSQL Full-Text Search (FTS) & Trigrams:**
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

1. **Search index:** weighted PostgreSQL search vector, update triggers, GIN and trigram indexes.
2. **Discovery API:** published-tool filters, search ranking, sorting, pagination, and autocomplete.
3. **Explore:** responsive search and filters synchronized with the URL.
4. **Taxonomy pages:** category directory, category details, and tag details.
5. **Tool profile:** server-rendered profile, pricing, metadata, and structured data.
6. **SEO verification:** canonicals, empty-query indexing rules, sitemap coverage, and final checks.

### Progress

- **Subphase 1 — Search index:** Added a reversible Alembic migration and ORM mapping for weighted English `tsvector` search across tool name, tagline, description, and primary category. A GIN index supports full-text queries; a trigram GIN index supports fuzzy name matching. Triggers keep vectors current on tool edits and category renames. Alembic successfully generated offline SQL for the full migration chain. The migration has not been applied to a running PostgreSQL database in this environment.
- **Subphase 2 — Discovery API:** Extended the existing catalog service/repository and public routes with FTS plus trigram fallback, category/tag/pricing/verification filters, relevance/newest/alphabetical sorting, bounded pagination, `/search`, and name autocomplete. Reused the existing paginated response envelope. Trending and highest-rated sorts remain deferred until their source metrics exist. Python compilation and Ruff pass; OpenAPI confirms all three public discovery routes. PostgreSQL-backed query execution remains unverified because no database is running here.

- [x] **Task 3.1: PostgreSQL FTS Vector Migration**
  - [x] Add Alembic migration adding `search_vector tsvector` column to `tools`.
  - [x] Create triggers updating the vector on tool changes and category-name edits.
  - [x] Create GIN index on `search_vector`.
  - [x] Ensure `pg_trgm` is enabled and add a trigram index for fuzzy name matching.

- [x] **Task 3.2: Backend Discovery Query Engine (`backend/src/modules/catalog/`)**
  - [x] Implement dynamic query builder applying filters, search vector ranking (`ts_rank_cd`), and pagination.
  - [x] Extend `/api/v1/tools` and add `/api/v1/search` with the standard paginated envelope.
  - [x] Implement `/api/v1/search/autocomplete` for name suggestions.

- [ ] **Task 3.3: Explore Page (`frontend/src/app/(public)/explore/page.tsx`)**
  - Search input with debounced URL parameter updates.
  - Faceted sidebar filter: Categories checkbox list, Pricing model pills, Verified toggle.
  - Responsive tools grid with animated loading skeletons and empty states.

- [ ] **Task 3.4: Category & Tag Pages**
  - `frontend/src/app/(public)/categories/page.tsx`: Full taxonomy directory.
  - `frontend/src/app/(public)/categories/[slug]/page.tsx`: Individual category landing with dynamic metadata.
  - `frontend/src/app/(public)/tags/[slug]/page.tsx`: Tag landing page.

- [ ] **Task 3.5: Comprehensive Tool Detail Page (`frontend/src/app/(public)/tools/[slug]/page.tsx`)**
  - Server-render full tool profile from backend API.
  - Implement structured pricing plans table showing free tier vs. paid intervals.
  - Implement JSON-LD `SoftwareApplication` markup.
  - Safe outbound link tracking (rel="nofollow noopener").

- [ ] **Task 3.6: Technical SEO Verification**
  - Test OpenGraph image and metadata generation for `/tools/[slug]`.
  - Test canonical tag matches `https://aitoolsfinder.cloud/tools/[slug]`.
  - Verify `sitemap.xml` includes all published tools and active categories.

---

## 4. Milestone Exit Criteria

1. Search queries return relevant tools in <100ms.
2. Filters (category, pricing model, verified) accurately filter catalog results without breaking URL state.
3. Every published tool page renders complete metadata, pricing breakdown, and valid JSON-LD.
4. Lighthouse SEO and Performance scores ≥ 90 on tool detail and category pages.
