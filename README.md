# AIToolsFinder.cloud — AI Tool Intelligence Platform

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Core Positioning:** *"Find the best AI tool for your exact job."*

AIToolsFinder is a premium AI Tool Intelligence Platform designed to help users discover, compare, evaluate, and select the best AI tools, GPTs, and SaaS products.

---

## 1. Monorepo Structure

```text
├── frontend/          # Next.js 15+ App Router, TypeScript, Tailwind, GSAP, Three.js
├── backend/           # Python 3.11+ FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic
├── deploy/            # Docker Compose and Nginx reverse proxy configuration
│   ├── docker-compose.yml
│   └── nginx/
├── docs/              # 17 Architectural and product specifications
│   └── plans/         # Detailed implementation plans for Phases 1 to 8
├── data/
│   └── taxonomy/      # Source categories (40) and tags (105)
└── .github/
    └── workflows/     # Independent CI/CD pipelines
```

---

## 2. Approved Technology & Deployment Stack

- **Frontend:** Next.js (TypeScript), Tailwind CSS, shadcn/ui, Three.js / React Three Fiber, GSAP
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy 2.0, Alembic, Uvicorn
- **Database:** PostgreSQL (Supabase or containerized PostgreSQL)
- **Deployment Topology:**
  - Single AWS EC2 instance running Docker Compose.
  - Nginx reverse proxy terminating TLS, routing `/` to frontend (port 3000) and `/api/` to backend (port 8000).
  - Internal Docker network with only ports 80 and 443 publicly exposed.
- **AWS Services:** EC2, Amazon ECR (independent frontend and backend repositories), S3 (private), CloudFront (OAC), IAM (roles via instance profile), CloudWatch, Cognito.
- **CI/CD:** GitHub Actions with OIDC for keyless ECR publishing and EC2 deployment with automatic rollback.
- **AI Engine:** OpenRouter (catalog-grounded recommendations).
- **Integrations:** Tiun Business (payments), Resend (email), PostHog (analytics).

---

## 3. Brand Identity & Design System

- **Primary Background:** Space Black (`#010102`)
- **Primary Brand Color:** Deep Lavender (`#7022FC`)
- **Accent Color:** Sunrise Orange (`#FD8F32`)
- **Supporting Surfaces:** `#0B0A0F`, `#121018`, `#1A1722`
- **Borders:** `#302A3A`
- **Text:** `#F7F5FA` (Primary), `#B5ADBF` (Secondary), `#81788D` (Muted)

---

## 4. Local Development

1. Setup environment configuration:
   ```bash
   cp .env.example .env
   ```
2. Start containers via Docker Compose:
   ```bash
   docker compose -f deploy/docker-compose.yml up -d
   ```
3. Endpoints:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/api/v1`
   - API Docs: `http://localhost:8000/docs`
