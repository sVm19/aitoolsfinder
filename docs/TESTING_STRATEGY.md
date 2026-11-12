# Testing Strategy — AIToolsFinder.cloud

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Testing Structure:** Independent test suites for `frontend/` (TypeScript) and `backend/` (Python) with automated CI/CD gates.

---

## 1. Testing Pyramid

- **Unit Tests:** Domain services, deterministic scoring models, Pydantic validators, React UI components.
- **Integration Tests:** FastAPI REST endpoints + PostgreSQL queries, provider adapters (Cognito, OpenRouter, Tiun, Resend).
- **End-to-End (E2E) Tests:** Core discovery and moderation journeys executed in headless Chromium via Playwright.
- **Deployment Health Probes:** Automated container readiness checks (`/health/ready` and HTTP 200 on frontend) triggering automatic rollback if failed.

---

## 2. Frontend Application (`frontend/`)

- **Tooling:** TypeScript (`tsc --noEmit`), Vitest, React Testing Library, Playwright.
- **Test Scope:**
  - Responsive navigation and accessible keyboard drawer.
  - Search input debouncing and query parameter state synchronization.
  - `ToolCard` interactive states (save trigger, compare tray trigger, hover glow).
  - Side-by-side `ComparisonMatrix` rendering across viewports.
  - Reduced-motion compliance (`@media (prefers-reduced-motion)`).
  - Zero layout shift (CLS ≤ 0.1) and loading skeleton fallbacks.

---

## 3. Backend Application (`backend/`)

- **Tooling:** Pytest, pytest-asyncio, HTTPX, Ruff.
- **Test Scope:**
  - Pydantic v2 input/output schema validation.
  - Repository & service boundary operations.
  - Server-side RBAC and Cognito token validation.
  - PostgreSQL full-text search and trigram ranking relevance.
  - Deterministic intelligence scoring calculations (no floating point drift).
  - OpenRouter candidate ID verification and anti-hallucination guardrails.
  - Recommendation rate limiting (5/minute/IP → 429) and feedback persistence.
  - Payment webhook signature verification and event deduplication idempotency.

---

## 4. Critical E2E User Journeys

1. **Journey 1 (Discovery):** Visitor searches for "SEO" on homepage → filter by "Freemium" → clicks tool card → arrives at `/tools/[slug]` with valid metadata.
2. **Journey 2 (Comparison):** Visitor selects 2 tools → opens comparison drawer → navigates to `/compare/[slug]` → verifies difference highlights.
3. **Journey 3 (AI Finder):** Visitor submits natural language prompt → receives ranked candidates with tradeoffs → all candidates verified against database.
4. **Journey 4 (Save Tool):** Visitor clicks save → prompted to sign in → completes Cognito auth → tool appears in `/dashboard`.
5. **Journey 5 (Vendor Moderation):** Vendor submits tool on `/submit` → admin approves in `/admin/submissions` → tool is immediately published live.
6. **Journey 6 (Payment Idempotency):** Duplicate payment webhook payload delivered → backend records event once and responds 200 OK without state corruption.

---

## 5. CI/CD Quality Gates

- A pull request cannot merge if:
  - Backend: `ruff check`, `ruff format --check`, or `pytest` fails.
  - Frontend: `npm run typecheck` or `npm run build` fails.
- Production deployment aborts and rolls back if post-deployment container health probes fail within 60 seconds.
