# Development Roadmap — AIToolsFinder.cloud

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Architecture:** Monorepo with `frontend/` (Next.js) and `backend/` (FastAPI Modular Monolith)  
**Deployment Target:** Single AWS EC2 instance running Docker Compose, Nginx, and Amazon ECR  
**Milestone Progression Policy:** Work one phase at a time; each milestone must pass its explicit exit criteria before proceeding.

---

## Phase 0 — Project Foundation (Completed & Verified)
- Monorepo folder structure (`frontend/`, `backend/`, `deploy/`, `docs/`, `data/taxonomy/`).
- FastAPI backend application factory with structured logging, Request-ID middleware, CORS, and health endpoints (`/health/live`, `/health/ready`).
- Next.js frontend application with TypeScript, Tailwind CSS, Space Black & Deep Lavender brand tokens, and canonical metadata for `https://aitoolsfinder.cloud`.
- Docker Compose local orchestration and Nginx reverse proxy configuration.
- Independent CI quality gate workflow (`.github/workflows/ci.yml`) with path-based change detection.
- **Exit Criteria:** Both applications run, 5/5 Pytest tests pass, Next.js production build succeeds, and CI quality gates pass.

---

## Phase 1 — Catalog Foundation
- PostgreSQL models in Supabase/Docker: `categories`, `tags`, `tools`, `tool_categories`, `tool_tags`, `features`, `tool_features`, `pricing_plans`.
- Alembic database migration management.
- Taxonomy seed script (`backend/scripts/seed_taxonomy.py`) parsing 40 categories and 105 tags.
- Catalog validation rules, unique slug generators, and status state machine (`draft`, `pending_review`, `published`, `archived`).
- Backend REST endpoints: Public catalog reads and Admin CRUD operations under `/api/v1/`.
- **Exit Criteria:** Admin can CRUD catalog entities; 40 categories and 105 tags are seeded; Pytest suite passes.

---

## Phase 2 — Frontend Foundation & Design System
- Design tokens active: Space Black (`#010102`), Deep Lavender (`#7022FC`), Sunrise Orange (`#FD8F32`), Dark surfaces (`#0B0A0F`, `#121018`, `#1A1722`), Borders (`#302A3A`).
- Accessible UI component suite (shadcn/ui customized): Button, Badge, Input, Select, Dialog, Dropdown, Skeleton.
- Domain components: Navbar (with keyboard-trapped mobile drawer), Footer, ToolCard, CategoryCard, ScoreBadge.
- GSAP purposeful animation utilities with `@media (prefers-reduced-motion)` support and teardown cleanup.
- Lazy-loaded React Three Fiber hero canvas with static CSS fallback (zero LCP blocking).
- Complete 11-section homepage layout adhering to `docs/UI_UX_GUIDELINES.md`.
- **Exit Criteria:** Responsive shell verified on mobile, tablet, and desktop; zero CLS; Next.js production build clean.

---

## Phase 3 — Discovery Engine & Search
- PostgreSQL Full-Text Search (`tsvector`) with GIN indexing and `pg_trgm` typo tolerance.
- Multi-faceted filter engine: query (`q`), category, tags, pricing model, verified badge, sorting.
- `/explore`: Interactive catalog discovery with URL query parameter synchronization.
- `/categories` & `/categories/[slug]`: Master directory and SEO category landing pages.
- `/tags/[slug]`: Tag landing pages.
- `/tools/[slug]`: Comprehensive tool profile page adhering to the 14-section order.
- Server-rendered JSON-LD structured data (`SoftwareApplication`, `BreadcrumbList`, `Organization`).
- **Exit Criteria:** Visitor can search and filter catalog in <100ms; SEO pages render complete metadata with canonical URLs.

---

## Phase 4 — Intelligence Engine
- Side-by-side comparison engine (`/compare/[slug]`) with normalized feature support and pricing breakdown.
- Dynamic compare drawer allowing visitors to pick 2–4 tools for ephemeral comparison (`/compare/preview`).
- Alternatives engine (`/alternatives/[slug]`) backed by `tool_alternatives` competition graph.
- Multi-dimensional scoring framework stored in `score_history` with public disclosure at `/methodology`.
- Curated and calculated category rankings (`/rankings/[slug]`) clearly separating organic ranks from sponsored placements.
- **Exit Criteria:** Comparison matrices align cleanly across viewports; scoring calculations are deterministic with historical snapshots.

---

## Phase 5 — AI Recommendations Engine
- OpenRouter client adapter with timeouts, bounded retries, and token usage logging.
- Two-stage grounded retrieval pipeline: Supabase FTS candidate selection -> LLM ranking & explanation -> database ID verification.
- Anti-hallucination guardrails: zero invented tools, prices, or ratings; factual tradeoffs.
- Interactive AI Finder interface (`/ai-finder`) with natural-language prompt intake.
- Fallback resilience: seamless degradation to catalog search if OpenRouter API is unavailable.
- **Exit Criteria:** Natural language queries return ranked candidates in <3s; 100% of recommended tools match database records.

---

## Phase 6 — User Systems & Cognito Auth
- AWS Cognito User Pool integration with backend JWKS signature validation and caching.
- Internal `users` table mapped to Cognito `cognito_sub` with RBAC (`user`, `vendor`, `admin`).
- Saved Tools (`saved_tools`) bookmarking and saved comparisons.
- Custom brand-styled authentication screens (`/login`, `/signup`, `/forgot-password`, `/auth/callback`).
- User Dashboard (`/dashboard`): Saved tools grid, comparison sets, and profile preferences.
- **Exit Criteria:** User can register, sign in, save tools to dashboard, and access protected endpoints with valid JWTs.

---

## Phase 7 — Monetization & Submissions
- Public vendor tool submission form (`/submit`) with multi-step validation.
- Admin moderation console (`/admin/submissions`): approve/reject with notes, auto-promote to live `tools` record.
- Transactional notification emails via Resend for submission receipts and approvals.
- Safe outbound affiliate click tracking (`/api/v1/outbound/{tool_id}`) with open-redirect protection and FTC disclosures.
- Tiun Business payment webhook receiver: signature verification, event deduplication on `(provider, provider_event_id)`, and idempotent processing.
- **Exit Criteria:** Vendor submission promoted to live published tool; affiliate clicks tracked; duplicate payment webhooks handled idempotently.

---

## Phase 8 — Production Hardening & AWS Deployment
- AWS infrastructure provisioning: EC2 single instance (`t3.medium`/`t4g.medium`), Amazon ECR separate frontend/backend repositories, private S3 bucket, CloudFront OAC, IAM instance profile.
- Automated GitHub Actions deployment pipeline (`.github/workflows/deploy.yml`) with GitHub OIDC authentication.
- Automated health check verification (`/health/live`, `/health/ready`) with automatic rollback on failure.
- Core Web Vitals optimization: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
- Security audit: HSTS, CSP, rate limiting, and dependency vulnerability scans.
- Monitoring & cost control: CloudWatch logs/alarms and AWS Budgets billing threshold alerts.
- **Exit Criteria:** Live on `https://aitoolsfinder.cloud` with Let's Encrypt TLS; green Core Web Vitals; CI/CD deployment and rollback drill verified.
