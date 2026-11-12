# AIToolsFinder.cloud — Master Implementation Plans

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Architecture:** Monorepo with two independently deployable applications:
- `frontend/` (Next.js 15+ App Router, TypeScript)
- `backend/` (FastAPI Python Modular Monolith)  
**Deployment Target:** Single AWS EC2 instance running Docker Compose, Nginx Reverse Proxy, and Amazon ECR  
**Database:** Supabase (Managed DB)  
**Source of Truth:** `/docs`

---

## 1. Monorepo & Deployment Architecture Overview

The platform is designed to maximize engineering speed, type-safety, and operational simplicity without premature microservices or Kubernetes bloat:

```text
Browser / Crawler
       │
       │ HTTPS (:443) / HTTP (:80)
       ▼
 [ Nginx Reverse Proxy (Let's Encrypt TLS, Rate Limiting, Security Headers) ]
       │                                                      │
       │ Internal Docker Network                              │ Internal Docker Network
       ▼ (port 3000)                                          ▼ (port 8000)
 [ frontend Container ]                                [ backend Container ]
 (Next.js SSR & Static Assets)                         (FastAPI Modular Monolith)
       │                                                      │
       │ Server-side REST API calls                           │ SQLAlchemy 2.0 (asyncpg / psycopg3)
       └─────────────────────────────────────────────────────►│
                                                              │
                                   ┌──────────────────────────┴──────────────────────────┐
                                   ▼                                                     ▼
                  [ Supabase Database ]                                      [ AWS Ecosystem ]
           (Supabase Managed DB / Containerized DB)                    (ECR, Cognito, CloudFront+S3, CloudWatch)
```

### Core Architecture Rules:
1. **Independent Applications:** `frontend/` and `backend/` each have their own Dockerfile, dependencies, environment configs, build process, health-check endpoints, and test suites.
2. **Network Isolation:** Only ports 80 and 443 are publicly accessible. Application ports (`3000` and `8000`) remain strictly internal to the Docker bridge network. SSH is restricted to admin IPs.
3. **Nginx Routing:**
   - `https://aitoolsfinder.cloud/` → Next.js frontend container (`frontend:3000`).
   - `https://aitoolsfinder.cloud/api/` → FastAPI backend container (`backend:8000`).
   - `https://aitoolsfinder.cloud/api/docs` & `/docs` → FastAPI OpenAPI documentation.
4. **CI/CD with Independent Pipelines:** GitHub Actions uses path filtering to build and test only the application whose source code has changed. Images are pushed to separate Amazon ECR repositories (`aitoolsfinder-frontend` and `aitoolsfinder-backend`) using GitHub OIDC.
5. **Automated Rollback:** Deployment to EC2 verifies `/health/ready` and HTTP 200 on frontend; if checks fail within 60 seconds, containers roll back to the previous image SHA tag.

---

## 2. 8-Phase Master Execution Index

| Phase | Plan Document | Primary Focus | Database Entities | Exit Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | Completed (`Phase 0 Foundation`) | Monorepo (`frontend/`, `backend/`), Docker Compose, Nginx, CI/CD, Health Checks | — | Health checks & CI pass cleanly |
| **Phase 1** | [`PHASE_1_CATALOG_FOUNDATION.md`](./PHASE_1_CATALOG_FOUNDATION.md) — **Completed** | Supabase catalog models, Alembic migrations, Taxonomy seeds, Admin CRUD | `categories`, `tags`, `tools`, `features`, `pricing_plans` | Admin can CRUD and seed 40 categories & 105 tags |
| **Phase 2** | [`PHASE_2_FRONTEND_FOUNDATION.md`](./PHASE_2_FRONTEND_FOUNDATION.md) — **In Progress** | Design tokens, Typography, Reusable UI primitives, Dark SaaS Layout | — | Responsive layout with Space Black & Deep Lavender |
| **Phase 3** | [`PHASE_3_DISCOVERY_ENGINE.md`](./PHASE_3_DISCOVERY_ENGINE.md) | Search, Postgres FTS, Filtering, Explore, Tool Profiles | `tools`, `categories`, `tags` (FTS vector + GIN index) | Public tool discovery in <60s with full SEO markup |
| **Phase 4** | [`PHASE_4_INTELLIGENCE_ENGINE.md`](./PHASE_4_INTELLIGENCE_ENGINE.md) | Comparisons, Alternatives, Scoring Models, Rankings | `comparisons`, `tool_alternatives`, `score_history` | Reproducible scoring and side-by-side matrices |
| **Phase 5** | [`PHASE_5_AI_RECOMMENDATIONS.md`](./PHASE_5_AI_RECOMMENDATIONS.md) — **Completed & Verified** | OpenRouter integration, Natural Language Tool Finder | Grounded in `tools` catalog IDs (Zero hallucination); adds `recommendation_feedback` | Explainable match recommendations returned |
| **Phase 6** | [`PHASE_6_USER_SYSTEMS_AND_AUTH.md`](./PHASE_6_USER_SYSTEMS_AND_AUTH.md) | AWS Cognito Auth, User Dashboard, Saved Tools | `users`, `saved_tools` | User profile, bookmarking, and preference persistence |
| **Phase 7** | [`PHASE_7_MONETIZATION_AND_SUBMISSIONS.md`](./PHASE_7_MONETIZATION_AND_SUBMISSIONS.md) | Vendor submissions, Moderation, Affiliate tracking, Tiun webhooks | `vendors`, `tool_submissions`, `affiliate_links`, `outbound_clicks`, `payment_events` | Idempotent event processing & moderation flow |
| **Phase 8** | [`PHASE_8_PRODUCTION_HARDENING_AND_DEPLOYMENT.md`](./PHASE_8_PRODUCTION_HARDENING_AND_DEPLOYMENT.md) | EC2 single instance, ECR publishing, CloudFront OAC, CI/CD rollback drills, CWV | Production backups & monitoring | LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, Live on AWS |
