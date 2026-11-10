# Deployment and Operations — AIToolsFinder.cloud

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Target Environment:** Single AWS EC2 instance running Docker Compose, Nginx Reverse Proxy, and Amazon ECR with GitHub Actions CI/CD.

---

## 1. Production Architecture Overview

The production system runs on a **single AWS EC2 instance** running Docker Compose. Nginx acts as the reverse proxy and TLS termination layer. Both application containers run on an internal Docker bridge network with no publicly exposed ports other than 80 and 443.

```text
Internet
   │
   ├── HTTPS (:443) / HTTP (:80) ────► [ Nginx Reverse Proxy ]
   │                                           ├── /api/* ──► [ backend:8000 ]
   │                                           └── /*     ──► [ frontend:3000 ]
   │
   └── Static Media / Images ────────► [ AWS CloudFront + S3 (OAC) ]
```

---

## 2. Container Registry — Amazon ECR

Two distinct, versioned private Amazon ECR repositories are used:
1. **`aitoolsfinder-frontend`**: Next.js App Router container images.
2. **`aitoolsfinder-backend`**: FastAPI modular monolith container images.

Image tags are pinned to immutable Git commit SHAs (e.g., `aitoolsfinder-backend:sha-a1b2c3d`) plus a `latest` pointer for staging convenience.

---

## 3. Independent CI/CD Pipelines (GitHub Actions)

The deployment pipeline is automated via `.github/workflows/deploy.yml` using **GitHub OIDC** for AWS authentication (zero long-lived AWS access keys stored in GitHub repository secrets).

### Pipeline Workflow:
1. **Code Push:** Developer pushes commits to `main`.
2. **Path-Based Change Detection (`paths-filter`):**
   - If only `backend/` changed → Only backend tests, image build, and backend container redeployment run.
   - If only `frontend/` changed → Only frontend tests, image build, and frontend container redeployment run.
   - If shared/deploy files changed → Both pipelines execute.
3. **Automated Testing Quality Gates:**
   - Backend: Ruff lint, format check, and Pytest test suite.
   - Frontend: TypeScript type-check (`tsc --noEmit`) and Next.js build.
4. **Docker Image Build & Security Scan:**
   - Multi-stage Docker builds.
   - Container vulnerability scan via Trivy / AWS ECR basic scanning.
5. **ECR Image Publishing:**
   - Authenticate to Amazon ECR via GitHub OIDC IAM role.
   - Push tagged images to `aitoolsfinder-frontend` and `aitoolsfinder-backend`.
6. **EC2 Rolling Deployment:**
   - EC2 deployment runner updates `.env` with new image SHAs.
   - Executes `docker compose pull` and `docker compose up -d --no-deps <service>`.
7. **Post-Deployment Health Verification:**
   - Probe `http://localhost:8000/api/v1/health/ready` (verifies backend + database connectivity).
   - Probe `http://localhost:3000` (verifies Next.js SSR status 200).
8. **Automated Rollback:**
   - If health checks fail within 60 seconds, deployment automatically reverts to previous image SHA tag and restarts containers.

---

## 4. Nginx Reverse Proxy & Routing Rules

Nginx handles TLS termination via Let's Encrypt / Certbot and routes incoming traffic internally:
- `https://aitoolsfinder.cloud/` → Proxied to Next.js container (`frontend:3000`).
- `https://aitoolsfinder.cloud/api/` → Proxied to FastAPI container (`backend:8000/api/`).
- `https://aitoolsfinder.cloud/api/docs` & `https://aitoolsfinder.cloud/docs` → Proxied to backend OpenAPI docs.
- Security Headers: HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Only ports **80** and **443** are open in the EC2 Security Group. SSH (port 22) is restricted strictly to admin IP addresses.

---

## 5. Cost Guardrails & Resource Management

To maintain tight budget control for an early-stage deployment:
- **No Kubernetes & No Microservices:** Kept as a lightweight Docker Compose modular monolith.
- **No Redis initially:** Rely on Next.js in-memory caching and PostgreSQL query optimization until measured latency requires Redis.
- **EC2 Instance Sizing:** Initial deployment on `t3.medium` or `t4g.medium` (2 vCPU, 4GB RAM) with memory swap configured (2GB) to absorb build spikes.
- **AWS Budgets:** Configured with billing threshold alerts (e.g., $25, $50, $100) alerting via email.
- **CloudWatch Retention:** Pinned to 14 days retention to prevent log storage cost accumulation.
- **Database Backups:** Automated daily snapshots in Supabase (or S3 daily dumps if containerized PostgreSQL).
