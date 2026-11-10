# Implementation Plan — Phase 2: Frontend Foundation & Design System

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Frontend Application:** `frontend/` (Next.js 15+ App Router, Tailwind CSS, shadcn/ui, GSAP, Three.js / R3F)  
**Status:** Complete (Phase 1 is complete)  
**Exit Criteria:** Production design tokens active; reusable UI component suite ready; accessible responsive shell and homepage layout verified on mobile, tablet, and desktop.

---

## Implementation Progress

- **Subphase 1 — Shared site shell:** The homepage now uses the shared `Navbar` and `Footer`. The mobile navigation drawer has dialog semantics, keyboard focus management, Escape handling, focus restoration, and scroll locking.
- **Subphase 2 — UI primitives:** Added native Select and Checkbox controls, a controlled native Dialog, an accessible Tooltip, a keyboard-operable disclosure menu, Skeleton, EmptyState, and ErrorState. Extended Button with a destructive variant and added invalid-state styling to form controls. TypeScript check passes.
- **Subphase 3 — Theme tokens:** Added the missing font, accessible lavender text, muted text, radius, ring, and glow mappings. Replaced component color literals with semantic Tailwind tokens. Raised muted text from `#81788D` (4.21:1 on `#1A1722`) to `#948CA0` (5.48:1 on `#1A1722`); the remaining text tokens measured at or above 4.5:1 on the dark surface palette.
- **Subphase 4 — Breadcrumbs:** Added an accessible breadcrumb component whose visible trail also supplies typed `BreadcrumbList` JSON-LD. Absolute URLs now use a shared same-origin canonical URL helper. The schema is a strong candidate (95/100); Google currently supports breadcrumb rich results on desktop, but does not guarantee display. Live Rich Results validation awaits use on a nested page.
- **Subphase 5 — Domain cards:** Tool cards link to tool/category destinations and expose optional save/compare actions only when handlers are supplied. Category counts are omitted unless sourced. Score badges validate their input and link to the methodology page.
- **Subphase 6 — Motion and homepage:** Added a reduced-motion-aware GSAP wrapper and an optional, delayed React Three Fiber hero scene with a CSS fallback. The homepage has nine content sections plus shared navigation and footer, giving the planned eleven top-level parts. Empty catalog/ranking/comparison states avoid invented product data; search uses a GET form. Links to routes planned for later phases disable speculative prefetching.
- **Subphase 7 — Verification:** TypeScript and production builds pass. A production browser audit passed at 375, 768, 1280, and 1920px: HTTP 200, no horizontal overflow, nine main sections, CLS 0, no console/page errors, and the mobile menu opens/closes with Escape and restores focus. The tablet audit exposed and fixed navigation overflow by moving the desktop nav breakpoint to 1024px.

## 1. Objectives & Scope

Phase 2 builds the **premium dark SaaS frontend foundation** for `https://aitoolsfinder.cloud`. It translates the brand guidelines from `docs/DESIGN_SYSTEM.md` and `docs/UI_UX_GUIDELINES.md` into accessible, high-performance React components with purposeful motion and strict CWV budgets (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1).

### In Scope
1. **Brand Theme & Design Tokens:**
   - Space Black (`#010102`) main background.
   - Deep Lavender (`#7022FC`) primary interactive brand color.
   - Sunrise Orange (`#FD8F32`) accent and selective highlight.
   - Dark surfaces (`#0B0A0F`, `#121018`, `#1A1722`) and borders (`#302A3A`).
   - Restrained lavender and sunrise orange glow box-shadow tokens.
2. **Accessible Component Primitives (shadcn/ui customized):**
   - `Button` (primary, secondary, outline, ghost, destructive).
   - `Badge` (verified, sponsored, pricing model, category tag).
   - `Input`, `SearchInput`, `Select`, `Checkbox`, `Dialog`, `DropdownMenu`, `Tooltip`.
   - `Skeleton`, `EmptyState`, and `ErrorState` components.
3. **Domain-Specific Components:**
   - `Navbar`: Desktop navigation + mobile drawer with keyboard navigation.
   - `Footer`: Structured links, legal pages, canonical domain notice.
   - `ToolCard`: Logo, verified pill, factual tagline, category chip, price interval, save/compare triggers.
   - `CategoryCard`: Visual category grouping with tool counters.
   - `ScoreBadge`: Numerical score with methodology popover trigger.
4. **Motion & 3D Integration:**
   - GSAP animation wrappers respecting `@media (prefers-reduced-motion: reduce)` with lifecycle teardown.
   - Optional 3D hero canvas via React Three Fiber (R3F) lazy-loaded with static CSS fallback to guarantee zero LCP blocking.
5. **Homepage Complete Layout (11 Structured Sections):**
   - Navbar -> Hero & Search -> Category shortcuts -> Trending tools -> Curated rankings -> Popular comparisons -> AI Finder teaser -> Recently added -> Editorial -> Vendor CTA -> Footer.

### Homepage Design Plan

Software. The page's single main job is to help a visitor find a tool for a specific task. Use the existing category taxonomy, show no invented tools or scores, and keep one R3F scene in the hero visual.

1. Hero — task-led copy, working search input, product workflow visual; one screen.
2. Category shortcuts — real taxonomy labels in a responsive link grid; one screen.
3. Trending tools — honest catalog empty state until sourced records are connected; one screen.
4. Curated rankings — explain evidence and methodology without fabricated placements; one screen.
5. Popular comparisons — show the comparison entry point without invented tool pairs; one screen.
6. AI Finder — explain catalog-grounded matching as a planned capability; one screen.
7. Recently added — honest empty state until published records are connected; one screen.
8. Editorial — concise selection guidance; one screen.
9. Vendor CTA — one submission call to action; one screen.

---

## 2. Component Hierarchy & Layout

```text
[ RootLayout ]
 ├── [ Navbar ] (Desktop nav + Mobile slide-over drawer)
 ├── [ Main Content Area ]
 │    └── [ HomePage ]
 │         ├── Section 1: Hero Banner & Natural-Language Search Input
 │         ├── Section 2: Popular Category Shortcut Pills
 │         ├── Section 3: Trending Tools (ToolCard Grid)
 │         ├── Section 4: Curated Rankings Preview
 │         ├── Section 5: Popular Comparisons Showcase
 │         ├── Section 6: AI Finder Feature Teaser
 │         ├── Section 7: Recently Added Tools
 │         ├── Section 8: Editorial Highlights
 │         └── Section 9: Vendor Submission CTA
 └── [ Footer ] (Legal, Navigation, Canonical Domain Display)
```

---

## 3. Step-by-Step Task Checklist

- [x] **Task 2.1: CSS Tokens & Theme Synchronization**
  - [x] Verify all approved brand variables in `frontend/src/styles/globals.css`.
  - [x] Validate text contrast against the dark surface palette.
  - [x] Configure `frontend/tailwind.config.ts` theme extensions.

- [x] **Task 2.2: Base UI Primitive Scaffolding (`frontend/src/components/ui/`)**
  - [x] Implement accessible `Button` with lavender glow hover state and destructive variant.
  - [x] Implement `Badge` with semantic variants (default, outline, verified, sponsored, accent).
  - [x] Implement accessible modal dialogs, tooltips, and dropdowns.
  - [x] Implement accessible Select, Checkbox, loading skeletons, empty states, and error states.

- [x] **Task 2.3: Layout & Navigation (`frontend/src/components/common/`)**
  - [x] `Navbar.tsx`: Sticky navigation with glassmorphism blur (`backdrop-blur-md`).
  - [x] `MobileNav.tsx`: Keyboard-trapped navigation drawer with focus management.
  - [x] `Footer.tsx`: Canonical links and brand copyright.
  - [x] `breadcrumbs.tsx`: SEO-friendly navigation trail with Schema.org JSON-LD support.

- [x] **Task 2.4: Domain Tool Card & Category Card (`frontend/src/components/tool/`)**
  - `ToolCard.tsx`: Standard card displaying tool identity, logo fallback, pricing, verified badge, sponsored disclaimer, and bookmark action.
  - `CategoryCard.tsx`: Grid card for quick browsing.
  - `ScoreDisplay.tsx`: Rating visual with link to `/methodology`.

- [x] **Task 2.5: Purposeful Motion & 3D Hero (`frontend/src/components/animations/`)**
  - `MotionFadeIn.tsx`: GSAP entrance wrapper with reduced-motion bypass.
  - `HeroCanvas.tsx`: React Three Fiber ambient particle or abstract mesh component, dynamically imported with `ssr: false` and a static CSS gradient fallback.

- [x] **Task 2.6: Production Homepage Assembly (`frontend/src/app/page.tsx`)**
  - Connect all 11 sections in strict order specified by `docs/UI_UX_GUIDELINES.md`.
  - Implement search bar interactive states (hover, focus, keyboard triggers).
  - Integrate responsive grids (1-col mobile, 2-col tablet, 3-col desktop).

- [x] **Task 2.7: Verification & Responsiveness Audit**
  - Run `npm --prefix frontend run typecheck` and `npm --prefix frontend run build`.
  - [x] Test responsive breakpoints: 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (wide).
  - [x] Verify zero console/page errors, zero horizontal overflow, zero observed layout shifts (CLS < 0.1), and keyboard operation of the mobile navigation.

---

## 4. Milestone Exit Criteria

1. UI looks unmistakably like a premium dark SaaS product (Space Black `#010102`, Deep Lavender `#7022FC`, Sunrise Orange `#FD8F32`).
2. Homepage renders all 11 structural sections with responsive adaptation.
3. Accessible navigation opens, closes by Escape, and restores focus to its trigger.
4. Next.js production build succeeds with clean type checks.
