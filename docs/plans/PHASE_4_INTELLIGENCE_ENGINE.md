# Implementation Plan — Phase 4: Intelligence Engine

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Database:** PostgreSQL 16 (Supabase / Docker)  
**Status:** Queued (Depends on Phase 3)  
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

- [ ] **Task 4.1: Database Migrations for Intelligence Tables**
  - Create Alembic migration for `comparisons`, `comparison_tools`, `tool_alternatives`, `score_history`.
  - Add indexes: `score_history (tool_id, calculated_at DESC)`, `comparisons (slug)`.

- [ ] **Task 4.2: Backend Intelligence Module (`backend/src/modules/intelligence/`)**
  - Implement comparison service normalizing features and pricing side-by-side.
  - Implement `POST /api/v1/comparisons/preview` (unauthenticated ephemeral compare).
  - Implement `GET /api/v1/comparisons/{slug}` (public SEO comparison).
  - Implement `GET /api/v1/tools/{slug}/alternatives`.
  - Implement deterministic scoring calculator utility (`calculate_tool_score(tool)`).

- [ ] **Task 4.3: Comparison Page UI (`frontend/src/app/(public)/compare/[slug]/page.tsx`)**
  - Header with tools identity and quick "Winner for X use-case" verdict.
  - Sticky table header preserving tool names on scroll.
  - Feature matrix rows: Core features, Pricing tiers, API availability, Platform status.
  - Difference highlighter toggle ("Show only differences").

- [ ] **Task 4.4: Dynamic Compare Drawer (`frontend/src/components/comparison/CompareDrawer.tsx`)**
  - Floating compare tray at bottom of screen when user clicks "+ Compare" on any ToolCard.
  - Capacity for 2 to 4 tools.
  - "Compare Now" trigger navigating to dynamic preview.

- [ ] **Task 4.5: Alternatives Landing Pages (`frontend/src/app/(public)/alternatives/[slug]/page.tsx`)**
  - Curated alternative list with "Why switch?" rationale pills.
  - Quick comparison snippet between target tool and top 3 alternatives.

- [ ] **Task 4.6: Rankings System (`frontend/src/app/(public)/rankings/[slug]/page.tsx`)**
  - Leaderboard view with numerical ranks (#1, #2, #3).
  - Filter by Free vs. Paid.
  - Direct methodology popover on each score.

- [ ] **Task 4.7: Verification & Testing**
  - Pytest unit tests for score calculation determinism and zero floating-point drift.
  - Tests ensuring self-comparisons (`tool_id == alternative_tool_id`) are rejected by database check constraints.

---

## 3. Milestone Exit Criteria

1. Comparison matrix renders with accurate side-by-side alignment across mobile and desktop.
2. Alternatives relationships query cleanly with verified rationale text.
3. Every displayed score has a clickable link explaining the exact dimension breakdown.
4. Canonical comparison URLs pass all technical SEO checks.
