# Implementation Plan — Phase 4: Intelligence Engine

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Database:** Supabase 16 (Docker)  
**Status:** In Progress (Phase 3 live-data verification remains pending)

**Exit Criteria:** Users can compare 2–4 tools side-by-side; alternatives matrix active; scoring methodology explainable with historical snapshots.

---

## 1. Objectives & Scope

Phase 4 elevates the platform from a directory into a **decision intelligence engine**. It introduces normalized side-by-side comparison matrices, verified tool alternative graphs, explainable intelligence scoring, and transparent rankings.

### In Scope
1. **Comparison Engine:**
   - Pre-computed comparison landing pages for high-intent SEO (e.g., `/compare/chatgpt-vs-claude`).
   - Dynamic user-driven comparison drawer allowing visitors to pick 2–4 tools and compare them instantly.
   - Normalized feature support comparison (`yes`, `partial`, `no`, `unknown`) and pricing interval breakdown.
2. **Alternatives Engine:**
   - Graph relationships between competing products in `tool_alternatives`.
   - Dedicated alternatives landing pages (e.g., `/alternatives/midjourney`).
   - Algorithmic alternative suggestions based on overlapping categories and tags.
3. **Intelligence Scoring Model:**
   - Transparent, versioned scoring framework stored in `score_history`.
   - Dimensions: Feature Breadth (30%), Pricing Transparency (25%), Verification & Freshness (25%), Community & Documentation (20%).
   - Scoring methodology public disclosure page (`/methodology`).
   - Strict rule: Sponsored listings **never** alter organic intelligence scores.
4. **Rankings System:**
   - Category and tag rankings (e.g., `/rankings/best-ai-video-generators`).
   - Clear visual badges distinguishing Organic #1 from Sponsored Placement.

---

## 2. Step-by-Step Task Checklist

### Progress

- **Subphase 1 — Intelligence tables:** Added the Alembic migration for comparisons, comparison tools, tool alternatives, and score history, including the self-alternative check and requested indexes. Offline SQL generation passes. The nullable `created_by` column has no users FK yet because the users table is introduced in Phase 6; add that FK with the Phase 6 user migration. The migration has not been applied to a running Supabase database in this environment.
- **Subphase 2 — Backend intelligence:** Added ORM mappings, comparison preview and published-comparison endpoints, published-only curated and category/tag-overlap alternatives, and a versioned Decimal scoring utility. Feature support and pricing inputs are normalized into a comparison matrix. The score reports unavailable dimensions as `null` and excludes their weights; community and documentation signals are not in the current catalog schema. Ruff, Python compilation, OpenAPI route registration, and Alembic offline SQL generation pass. Score determinism and database behavior remain for Subphase 7; no live Supabase service is available here.
- **Subphase 3 — Comparison page:** Added the server-rendered `/compare/[slug]` page with canonical metadata, published tool links, sticky comparison headings, feature/pricing/platform/API rows, and a difference-only toggle. The page labels the overall verdict as unpublished instead of inventing a use-case winner. Typecheck and production build pass; the local route returns 200 with a noindex catalog-unavailable state because no comparison API/database data is running, so populated matrix behavior still needs data-backed review.
- **Subphase 4 — Compare tray:** Added a shared client-side selection tray to the app layout, wired all tool cards to add/remove actions, enforced the 2–4 tool range, and added `/compare/preview` to post selected slugs to the ephemeral comparison endpoint. Typecheck passes; the development server compiles both the preview page and catalog pages. The API is unavailable locally, so only the preview error state could be checked against a live server.
- **Subphase 5 — Alternatives pages:** Added `/alternatives/[slug]` with canonical metadata, published-only alternative cards, curated/related rationale and overlap labels, and a compact preview against up to three alternatives. Tool profiles now link to their alternatives page. Typecheck passes and the dev route returns 200 with the noindex unavailable-data state; populated alternative and preview content could not be checked without the catalog API/database.
- **Subphase 6 — Rankings:** Added latest-snapshot category and tag rankings APIs, pricing filters, organic ranks separated from sponsored placements, the category/tag ranking directory, score breakdowns with methodology links, and a public `/methodology` page matching scoring version v1. Ruff, Python compilation, ORM configuration, OpenAPI route registration, frontend typecheck, and local HTTP checks pass. No Supabase score snapshots are available, so populated rank ordering remains unverified.
- **Subphase 7 — Verification & testing:** Added focused tests for repeatable Decimal scoring (including the rounded weighted result) and rejection of self-alternatives by the ORM database check constraint. The full backend pytest suite passes (11 tests), as do Ruff and Python compilation. The constraint was exercised with the SQLite test database; the migration has not been applied to Supabase in this environment.
- **Deferred Supabase validation:** When the Supabase project/database is available, apply the Alembic migrations and verify the `tool_alternatives` self-reference check constraint against the database. Update this note with the result.

- [x] **Task 4.1: Database Migrations for Intelligence Tables**
  - [x] Create Alembic migration for `comparisons`, `comparison_tools`, `tool_alternatives`, `score_history`.
  - [x] Add indexes: `score_history (tool_id, calculated_at DESC)` and the unique `comparisons.slug` index.

- [x] **Task 4.2: Backend Intelligence Module (`backend/src/modules/intelligence/`)**
  - [x] Implement comparison service normalizing features and pricing side-by-side.
  - [x] Implement `POST /api/v1/comparisons/preview` (unauthenticated ephemeral compare).
  - [x] Implement `GET /api/v1/comparisons/{slug}` (public SEO comparison).
  - [x] Implement `GET /api/v1/tools/{slug}/alternatives`.
  - [x] Implement versioned deterministic scoring calculator utility (`calculate_tool_score(tool, as_of=...)`).

- [x] **Task 4.3: Comparison Page UI (`frontend/src/app/compare/[slug]/page.tsx`)**
  - [x] Header with tool identities and an explicit unpublished-winner state; no use-case winner is inferred without supporting data.
  - [x] Sticky table header preserving tool names on scroll.
  - [x] Feature matrix rows: Core features, Pricing tiers, API availability, Platform status.
  - [x] Difference highlighter toggle ("Show only differences").

- [x] **Task 4.4: Dynamic Compare Drawer (`frontend/src/components/comparison/compare-provider.tsx`)**
  - [x] Floating compare tray at bottom of screen when user selects a ToolCard.
  - [x] Capacity for 2 to 4 distinct tools, with removal and clear actions.
  - [x] "Compare now" trigger navigates to the noindex preview page and calls the ephemeral comparison API.

- [x] **Task 4.5: Alternatives Landing Pages (`frontend/src/app/alternatives/[slug]/page.tsx`)**
  - [x] Curated and related alternative list with "Why switch?" rationale pills.
  - [x] Quick comparison snippet between target tool and up to three alternatives.

- [x] **Task 4.6: Rankings System (`frontend/src/app/rankings/[slug]/page.tsx`)**
  - [x] Category and tag leaderboards use the latest score snapshot per published tool.
  - [x] Leaderboard view with numerical organic ranks; sponsored placements are labeled separately and do not affect organic positions.
  - [x] Filter by free/freemium versus paid pricing models.
  - [x] Score breakdown details and methodology link on every score.
  - [x] Public scoring methodology page documents weights, evidence rules, and unavailable dimensions.

- [x] **Task 4.7: Verification & Testing**
  - [x] Pytest unit test verifies deterministic Decimal score calculation without floating-point drift.
  - [x] Database test verifies self-comparisons (`tool_id == alternative_tool_id`) are rejected by the check constraint.

---

## 3. Milestone Exit Criteria

1. Comparison matrix renders with accurate side-by-side alignment across mobile and desktop.
2. Alternatives relationships query cleanly with verified rationale text.
3. Every displayed score has a clickable link explaining the exact dimension breakdown.
4. Canonical comparison URLs pass all technical SEO checks.
