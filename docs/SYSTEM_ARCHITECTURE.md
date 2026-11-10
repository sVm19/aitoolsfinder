# System Architecture — AIToolsFinder.cloud

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Architecture Style:** Monorepo with two independently deployable applications (`frontend/` and `backend/`) operating as a Modular Monolith.

---

## 1. Application Boundaries

The application is structured inside a single Git repository as two independently deployable applications:
- **`frontend/`** — Next.js 15+ (App Router) + TypeScript.
- **`backend/`** — FastAPI + Python 3.11+ modular monolith.

Each application maintains its own:
- Dedicated Dockerfile and multi-stage container build.
- Dependency definitions (`package.json` for frontend, `requirements.txt` for backend).
- Environment configurations (`.env.example`).
- Automated build process.
- Health-check endpoints (`/` for frontend, `/api/v1/health/live` & `/api/v1/health/ready` for backend).
- Independent testing structure (Vitest/Playwright for frontend, Pytest/HTTPX for backend).

---

## 2. Production Deployment Topology

The application deploys to a **single AWS EC2 instance** running Docker Compose behind an Nginx reverse proxy:

```text
Browser / Crawler
       │
       │ HTTPS (:443) / HTTP (:80)
       ▼
 [ Nginx Reverse Proxy (TLS Termination, Rate Limiting, Security Headers) ]
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
                  [ PostgreSQL Database ]                                      [ AWS Ecosystem ]
           (Supabase Managed DB / Containerized DB)                    (Cognito, CloudFront+S3, CloudWatch)
```

### Network Security & Routing Rules:
- Only ports **80** (HTTP redirect) and **443** (HTTPS) are publicly accessible from the internet.
- SSH access (port 22) is strictly restricted to designated administrator IP addresses.
- Application ports (`3000` for frontend, `8000` for backend) remain strictly internal to the Docker bridge network.
- **Reverse Proxy Routing:**
  - `https://aitoolsfinder.cloud/` → Proxied to `frontend:3000`.
  - `https://aitoolsfinder.cloud/api/` → Proxied to `backend:8000/api/`.
  - `https://aitoolsfinder.cloud/api/docs` & `/docs` → Proxied to backend OpenAPI documentation.

### Database Hosting Strategy:
PostgreSQL remains a decoupled service.
- **Option A (Recommended):** Supabase Managed PostgreSQL 16 using Session Pooler (port 5432, SSL required). Eliminates database maintenance, provides automated point-in-time recovery, automated backups, and includes native support for `pg_trgm` and `uuid-ossp`.
- **Option B (Local/Low-cost Fallback):** Containerized PostgreSQL 16 on the EC2 instance with persistent Docker volume (`pgdata`) and automated S3 backup scripts.

---

## 3. Backend Modular Monolith Boundaries

The backend adheres to a strict modular monolith architecture. Modules remain decoupled and encapsulate their own schemas, services, and repository layers:

1. **Authentication:** Cognito JWT validation, JWKS caching, user context injection.
2. **Tools:** Tool profile CRUD, status state machine (`draft`, `pending_review`, `published`, `archived`).
3. **Categories:** Hierarchical categories taxonomy, sorting, metadata.
4. **Tags:** Normalized tag slugs, associations.
5. **Search:** PostgreSQL Full-Text Search (`tsvector`), GIN indexing, `pg_trgm` typo tolerance.
6. **Comparisons:** Normalized side-by-side capability matrices, diff highlights.
7. **Alternatives:** Tool competition graph, substitution rationales.
8. **Rankings:** Curated and algorithmic leaderboards with transparent separation of organic vs. sponsored.
9. **Scoring:** Versioned intelligence scoring snapshots (`score_history`), multi-dimensional weightings.
10. **AI Finder:** Grounded OpenRouter recommendations anchored strictly to internal catalog IDs.
11. **Reviews:** User ratings (1–5 stars) and editorial moderation.
12. **Bookmarks:** User saved tools and saved comparison sets.
13. **Vendors:** Vendor profile management, verification statuses.
14. **Submissions:** Public tool submission intake and administrative moderation pipeline.
15. **Payments:** Tiun Business checkout sessions and idempotent webhook dispatching.
16. **Notifications:** Resend transactional emails for vendor submissions and alerts.
17. **Analytics:** PostHog product telemetry and anonymous outbound click tracking.

---

## 4. AWS Infrastructure Architecture

- **AWS EC2:** `t3.medium` or `t4g.medium` instance hosting Docker Compose.
- **Amazon ECR:** Two separate private repositories:
  - `aitoolsfinder-frontend` (Next.js container images).
  - `aitoolsfinder-backend` (FastAPI container images).
- **AWS S3:** Private bucket (`aitoolsfinder-media`) with Block Public Access enabled.
- **AWS CloudFront:** CDN distribution with **Origin Access Control (OAC)** to serve static media from S3.
- **AWS IAM:** EC2 Instance Profile with least-privilege IAM policies, completely eliminating hardcoded AWS access keys on the server.
- **AWS Cognito:** Managed User Pool and App Client for secure authentication.
- **AWS CloudWatch & Budgets:** Metrics collection, container log forwarding, and billing budget threshold alarms.
- **Route 53:** DNS management pointing `aitoolsfinder.cloud` and `www.aitoolsfinder.cloud` to the EC2 Elastic IP or CloudFront distribution.
