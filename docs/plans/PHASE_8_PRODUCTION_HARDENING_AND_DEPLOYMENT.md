# Implementation Plan — Phase 8: Production Hardening & AWS Deployment

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Hosting Environment:** Single AWS EC2 instance (Docker Compose + Nginx) + Amazon ECR + CloudFront OAC + PostgreSQL  
**Status:** Queued (Final Launch Milestone)  
**Exit Criteria:** Core Web Vitals targets met (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1); independent ECR pipelines verified; automated health checks and rollback drills operational; live on https://aitoolsfinder.cloud.

---

## 1. Objectives & Scope

Phase 8 is the **production release milestone**. It executes comprehensive security audits, performance profiling, Core Web Vitals optimization, AWS infrastructure provisioning (EC2, ECR, S3, CloudFront OAC, IAM, CloudWatch), and automated two-track GitHub Actions deployment with rollback capability.

### In Scope
1. **AWS Single-EC2 Infrastructure Deployment:**
   - Provision Ubuntu Server LTS EC2 instance (`t3.medium` or `t4g.medium`).
   - Security Group: Inbound 80 (HTTP), 443 (HTTPS), 22 (SSH restricted strictly to admin IP).
   - Application ports (`3000` and `8000`) remain strictly internal to the Docker network.
   - Nginx container with Let's Encrypt / Certbot TLS termination.
   - Reverse proxy routing:
     - `https://aitoolsfinder.cloud/` → Next.js container (`frontend:3000`).
     - `https://aitoolsfinder.cloud/api/` → FastAPI container (`backend:8000`).
     - `https://aitoolsfinder.cloud/api/docs` & `/docs` → OpenAPI documentation.
2. **Amazon ECR Dual Repositories:**
   - Private repository `aitoolsfinder-frontend` for Next.js images.
   - Private repository `aitoolsfinder-backend` for FastAPI images.
   - Images tagged with immutable Git commit SHAs.
3. **Independent CI/CD Pipelines (`.github/workflows/deploy.yml`):**
   - GitHub OIDC for keyless AWS authentication.
   - Path-based change detection (avoids rebuilding frontend if only backend changed, and vice versa).
   - Automated testing gates: Pytest, Ruff, TypeScript `tsc --noEmit`, Next.js build.
   - Automated rolling deployment on EC2.
   - Post-deployment health verification probe on `/health/ready` and frontend root.
   - Automated rollback to previous container SHA if health probes fail within 60 seconds.
4. **AWS Media Storage & CDN:**
   - Private S3 bucket `aitoolsfinder-media` with Block Public Access enabled.
   - AWS CloudFront distribution configured with **Origin Access Control (OAC)** to serve static media.
   - EC2 IAM Instance Profile with least-privilege permissions (`s3:PutObject`, `s3:GetObject`).
5. **Security Hardening & Review:**
   - Strict Content Security Policy (CSP), HSTS, and `X-Frame-Options: DENY`.
   - Dependency vulnerability scanning (`npm audit`, `pip-audit`).
   - Rate limiting enforced at Nginx and FastAPI middleware levels.
   - CORS restricted strictly to `https://aitoolsfinder.cloud`.
6. **Core Web Vitals & Performance Engineering:**
   - Largest Contentful Paint (LCP) ≤ 2.5s.
   - Interaction to Next Paint (INP) ≤ 200ms.
   - Cumulative Layout Shift (CLS) ≤ 0.1.
   - Image optimization with AVIF/WebP formats and explicit aspect ratios.
7. **Cost Guardrails & Operational Monitoring:**
   - AWS Budgets configured with email threshold alarms ($25, $50, $100).
   - CloudWatch log forwarding with 14-day retention.
   - Database point-in-time recovery and snapshot restore drill.

---

## 2. Production Topology Diagram (Mermaid)

```mermaid
graph TD
    Client([User Browser / Web Crawler])
    DNS[Route 53 / DNS: aitoolsfinder.cloud]
    CF[AWS CloudFront CDN]
    S3[(Private AWS S3 Bucket)]
    EC2[AWS EC2 Instance: t3.medium]
    Nginx[Nginx Reverse Proxy & TLS]
    WebCont[frontend Container :3000]
    APICont[backend Container :8000]
    Postgres[(PostgreSQL: Supabase / Docker)]
    OpenRouter[OpenRouter AI API]

    Client -->|HTTPS :443| DNS
    DNS --> Nginx
    Client -->|Static Media / Images| CF
    CF -->|Origin Access Control| S3

    Nginx -->|/api/*| APICont
    Nginx -->|/* (SSR & Static)| WebCont
    WebCont -->|Server API calls| APICont

    APICont -->|Session Pooler :5432| Postgres
    APICont -->|Presigned Uploads| S3
    APICont -->|Grounded Prompts| OpenRouter
```

---

## 3. Step-by-Step Task Checklist

- [ ] **Task 8.1: AWS Resource Provisioning**
  - Create EC2 instance (`t3.medium` or `t4g.medium`) in target AWS region (e.g., `us-east-1`).
  - Configure Security Group: Inbound 80 (HTTP), 443 (HTTPS), 22 (SSH restricted to admin IP).
  - Create Amazon ECR repositories: `aitoolsfinder-frontend` and `aitoolsfinder-backend`.
  - Create S3 bucket `aitoolsfinder-media` with S3 Object Ownership: Bucket owner enforced.
  - Create CloudFront distribution with S3 origin and OAC policy.
  - Attach IAM role allowing `s3:PutObject`, `s3:GetObject` to the EC2 instance profile.

- [ ] **Task 8.2: Nginx & TLS Automation (`deploy/docker-compose.prod.yml`)**
  - Add production docker-compose file mounting SSL certificates.
  - Setup Certbot container for automated Let's Encrypt certificate renewal.
  - Configure internal reverse proxy routing (`/` to `frontend:3000`, `/api/` to `backend:8000`, `/api/docs` to `backend:8000/docs`).
  - Configure HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).

- [ ] **Task 8.3: Independent Deployment Workflow (`.github/workflows/deploy.yml`)**
  - Authenticate to AWS via GitHub OIDC IAM role.
  - Use `dorny/paths-filter` to detect if `frontend/`, `backend/`, or both changed.
  - Build and push Docker images to respective ECR repositories tagged with Git commit SHA.
  - SSH/SSM command to EC2 pulling updated image and executing rolling container restart.
  - Verify `http://localhost:8000/api/v1/health/ready` and `http://localhost:3000`.
  - Trigger automatic rollback if health probes fail within 60 seconds.

- [ ] **Task 8.4: Security Audit & Penetration Hardening**
  - Verify all secrets (`APP_SECRET_KEY`, `OPENROUTER_API_KEY`, etc.) are in environment variables, absent from client bundles.
  - Test SQL injection resistance via parameterized SQLAlchemy statements.
  - Test open-redirect protection on `/api/v1/outbound/{tool_id}`.
  - Verify rate limits return HTTP 429 when threshold exceeded.

- [ ] **Task 8.5: Core Web Vitals Optimization**
  - Audit homepage and tool detail pages using Google PageSpeed Insights / Lighthouse.
  - Ensure font loading uses `font-display: swap`.
  - Confirm WebGL/Three.js assets do not load until user reaches interactive sections.
  - Verify CLS is 0.00 across all responsive breakpoints.

- [ ] **Task 8.6: Disaster Recovery & Cost Guardrails**
  - Configure AWS Budgets with $25/$50/$100 email threshold alerts.
  - Configure CloudWatch logs with 14-day retention.
  - Test database snapshot restore.
  - Conduct end-to-end user journey test: Search -> Tool Detail -> Compare -> AI Finder -> Outbound Click.

---

## 4. Launch Exit Criteria

1. `https://aitoolsfinder.cloud` resolves with valid Let's Encrypt TLS certificate.
2. Core Web Vitals green across all pages: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
3. Independent ECR pipelines deploy only modified services and execute automated rollbacks on failure.
4. Database connection pool operates stably under synthetic load.
5. Zero critical or high-severity vulnerabilities found in security audit.
