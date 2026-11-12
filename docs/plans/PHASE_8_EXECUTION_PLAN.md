# Phase 8 — Production Hardening & Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship https://aitoolsfinder.cloud on a single hardened EC2 instance with TLS, independent ECR pipelines, automated rollback, security gates, and Core Web Vitals verification.

**Architecture:** Docker Compose on one Ubuntu EC2 instance. Nginx terminates TLS and routes `/api/*` to FastAPI and everything else to Next.js on a private Docker network. Two ECR repositories hold immutable SHA-tagged images. GitHub Actions authenticates with OIDC, tests, builds, scans, pushes, deploys over SSH, probes health, and rolls back on failure. Terraform owns AWS resources; CloudFront + OAC serves private S3 media.

**Tech Stack:** Next.js 15 (standalone), FastAPI 0.115, PostgreSQL (Supabase or container), Nginx + Certbot, Docker Compose, Terraform (AWS provider v5), GitHub Actions, Playwright, Lighthouse CI, Trivy, pip-audit.

**Spec:** `docs/plans/PHASE_8_PRODUCTION_HARDENING_AND_DEPLOYMENT.md`

## Global Constraints

- Domain: `https://aitoolsfinder.cloud`; CDN host: `cdn.aitoolsfinder.cloud`.
- Region: `us-east-1`; instance type: `t3.medium`; only ports 80 and 443 are public; SSH restricted to `var.admin_cidr`.
- Images are tagged with immutable commit SHAs (`sha-<40-char-sha>`). ECR repos are `IMMUTABLE`, so no moving tags (`latest`) are pushed; deploys reference the SHA tag explicitly.
- No secrets in git, images, client bundles, or logs. All runtime configuration comes from env files or GitHub secrets.
- No Kubernetes, no Redis, no microservices. One EC2 instance, Docker Compose, Nginx.
- CloudWatch log retention: 14 days. AWS Budgets alerts at $25, $50, $100.
- Core Web Vitals targets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
- Every task ends with its listed verification command passing. Docker and Terraform may be unavailable on the developer machine; when they are, the same command runs in the CI job named in the task and must pass there before the task is marked complete.
- Update `docs/plans/PHASE_8_PRODUCTION_HARDENING_AND_DEPLOYMENT.md` checkboxes only after the corresponding command passes.
- Follow existing conventions: Python 3.12 formatting via `ruff format`, Pydantic v2 `ConfigDict`, standard error envelope `{error:{code,message,request_id}}`, frontend design tokens and server-page/client-view split.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `backend/src/main.py` | Mount identity/vendor routers once under `/api/v1` |
| `backend/src/modules/vendor/models.py` | Boolean server defaults; relationships without missing `back_populates` |
| `backend/alembic/env.py` | Import identity and vendor metadata for autogenerate |
| `backend/tests/conftest.py` | Register identity/vendor models in the SQLite test metadata |
| `backend/tests/test_router_mounting.py` | Prove routers resolve at the public paths |
| `backend/src/core/security.py` | Add `is_safe_outbound_url` helper |
| `backend/src/modules/vendor/router.py` | Reject unsafe affiliate redirect targets |
| `backend/tests/test_security_hardening.py` | Redirect and CORS regression tests |
| `frontend/next.config.ts` | `output: "standalone"`, CSP/HSTS, image formats |
| `frontend/src/app/layout.tsx` | Self-hosted Inter via `next/font` |
| `frontend/src/styles/globals.css` | Font stack uses `--font-inter` |
| `frontend/public/.gitkeep` | Makes the Dockerfile `COPY public` step valid |
| `deploy/docker-compose.prod.yml` | Production containers, awslogs, 127.0.0.1-only ports |
| `deploy/nginx/templates/default.conf.template` | TLS, redirect, rate limit, dynamic upstreams |
| `deploy/scripts/init-letsencrypt.sh` | Issue the first certificate |
| `deploy/scripts/deploy.sh` | Pull, restart one service, health-check, rollback |
| `deploy/scripts/rollback.sh` | Restore the previous tag for one service from `.BACKEND_TAG.previous` / `.FRONTEND_TAG.previous` |
| `deploy/scripts/bootstrap-ec2.sh` | Install Docker, Compose, clients, clone repo, cron |
| `deploy/scripts/backup-db.sh` / `restore-db.sh` | pg_dump to S3 / restore drill |
| `deploy/terraform/*` | EC2, SG, EIP, ECR, S3, CloudFront OAC, IAM, logs, budgets, DNS |
| `.github/workflows/deploy.yml` | OIDC deploy pipeline with scan and health gates |
| `.github/workflows/lighthouse.yml` | Scheduled Core Web Vitals gate |
| `frontend/lighthouserc.json` | LCP/CLS/TBT assertions |
| `frontend/playwright.config.ts`, `frontend/e2e/journey.spec.ts` | End-to-end journey |
| `docs/DEPLOYMENT.md`, `docs/ENVIRONMENT_VARIABLES.md` | Runbooks and deploy env vars |

---

## Task 1: Pre-flight backend fixes (routers, models, migrations)

The Phase 8 security and E2E gates cannot run while the vendor module fails to import and identity/vendor routers resolve under `/api/v1/api/v1`. Fix those defects first.

**Files:**
- Modify: `backend/src/main.py:24-25, 153-158`
- Modify: `backend/src/modules/vendor/models.py:1-20, 55, 99, 143, 260, 160, 183`
- Modify: `backend/alembic/env.py:17-19`
- Modify: `backend/tests/conftest.py:17-19`
- Create: `backend/tests/test_router_mounting.py`

**Interfaces:**
- Consumes: existing `identity_router` and `vendor_router`, each already declaring `APIRouter(prefix="/api/v1", ...)`.
- Produces: public paths `/api/v1/users/me`, `/api/v1/submissions`, `/api/v1/outbound/{tool_id}`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_router_mounting.py`:

```python
import pytest


@pytest.mark.asyncio
async def test_identity_routes_are_mounted_once(client):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_vendor_routes_are_mounted_once(client):
    response = await client.post("/api/v1/submissions", json={})
    assert response.status_code in (401, 422)


@pytest.mark.asyncio
async def test_duplicate_api_prefix_is_absent(client):
    response = await client.get("/api/v1/api/v1/users/me")
    assert response.status_code == 404
```

- [ ] **Step 2: Run the tests to confirm failure**

Run: `cd backend && python -m pytest tests/test_router_mounting.py -v`
Expected: collection error importing `src.modules.vendor` (`server_default=False` is not valid), or 404s for the single-prefixed paths.

- [ ] **Step 3: Fix vendor model defaults and relationships**

In `backend/src/modules/vendor/models.py`, add `text` to the SQLAlchemy imports:

```python
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func, text
```

Replace every boolean `server_default` with a SQL literal:

```python
    is_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
```

Apply the same pattern to `is_free` (line 99), `is_approved` (line 143), and line 260 (`text("false")` or `text("true")` matching the existing intent).

Remove `back_populates` from the two vendor relationships whose reverse side does not exist on `ToolModel`:

```python
    tool: Mapped["ToolModel"] = Relationship("ToolModel")
```

Do this for `AffiliateLinkModel.tool` and `OutboundClickModel.tool`.

- [ ] **Step 4: Mount each router exactly once**

In `backend/src/main.py`, add the vendor import next to the identity import:

```python
from src.modules.identity.router import router as identity_router
from src.modules.vendor.router import router as vendor_router
```

Replace the two include lines that currently add an extra prefix:

```python
    app.include_router(identity_router)
    app.include_router(vendor_router)
```

Both routers already declare `/api/v1`; passing `prefix="/api/v1"` again produces duplicate paths.

- [ ] **Step 5: Register the models for Alembic and tests**

In `backend/alembic/env.py` append:

```python
import src.modules.identity.models  # noqa: F401
import src.modules.vendor.models  # noqa: F401
```

In `backend/tests/conftest.py` append to the metadata imports:

```python
import src.modules.identity.models  # noqa: F401
import src.modules.vendor.models  # noqa: F401
```

- [ ] **Step 6: Run the routing tests and the full suite**

Run: `cd backend && python -m pytest tests/test_router_mounting.py -v`
Expected: 3 passed.

Run: `cd backend && python -m pytest -q`
Expected: all tests pass (33 existing + 3 new).

Run: `cd backend && python -c "import src.main"` 
Expected: exit code 0 (mapper configuration succeeds).

- [ ] **Step 7: Commit**

```bash
git add backend/src/main.py backend/src/modules/vendor/models.py backend/alembic/env.py backend/tests/conftest.py backend/tests/test_router_mounting.py
git commit -m "fix: mount identity and vendor routers once and repair vendor model imports"
```

---

## Task 2: Production Next.js build prerequisites

The frontend Dockerfile copies `.next/standalone` and `public/`, but neither exists today, so the production image cannot build.

**Files:**
- Modify: `frontend/next.config.ts`
- Modify: `frontend/Dockerfile`
- Create: `frontend/public/.gitkeep`

**Interfaces:**
- Consumes: existing `npm run build`; Docker build args `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_BASE_URL`.
- Produces: `.next/standalone/server.js`, a non-empty `public/`, and a production image with the public API URL baked in.

- [ ] **Step 1: Write the verification script**

Run this before the change and capture the failure:

```bash
cd frontend
npm run build >/dev/null
test -f .next/standalone/server.js
```

Expected: non-zero exit because `output: "standalone"` is not configured.

- [ ] **Step 2: Enable standalone output and image formats**

Replace `frontend/next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.aitoolsfinder.cloud",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 3: Create the public directory**

Create `frontend/public/.gitkeep` with a single comment line:

```text
# Keep this directory so the production Dockerfile COPY step succeeds.
```

- [ ] **Step 4: Bake public URLs into the Docker build**

In `frontend/Dockerfile`, inside the `builder` stage immediately before `RUN npm run build`, add:

```dockerfile
ARG NEXT_PUBLIC_APP_URL=https://aitoolsfinder.cloud
ARG NEXT_PUBLIC_API_BASE_URL=https://aitoolsfinder.cloud/api/v1
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
```

`NEXT_PUBLIC_*` values are inlined by Next at build time, so runtime container env cannot fix a client bundle that fell back to `http://localhost:8000/api/v1`.

- [ ] **Step 5: Verify the standalone build**

Run: `cd frontend && npm run build`
Expected: build succeeds and prints the route table.

Run: `cd frontend && test -f .next/standalone/server.js && echo "standalone ok"`
Expected: `standalone ok`.

- [ ] **Step 6: Commit**

```bash
git add frontend/next.config.ts frontend/Dockerfile frontend/public/.gitkeep
git commit -m "build: emit standalone Next output, public directory, and public env build args"
```

---

## Task 3: Security headers and self-hosted fonts

CSP, HSTS, and a real self-hosted font are required before the Lighthouse and security gates. Today `--font-sans: Inter` references a font that is never loaded.

**Files:**
- Modify: `frontend/next.config.ts`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/styles/globals.css:5-6`

**Interfaces:**
- Consumes: existing root layout and global CSS.
- Produces: `Content-Security-Policy` and production `Strict-Transport-Security` headers; CSS variable `--font-inter`.

- [ ] **Step 1: Add the header assertions as a script**

Run after implementing, from a production server:

```bash
cd frontend
npm run build
(npx next start -p 3100 &) && sleep 5
curl -sI http://localhost:3100/ | grep -i "content-security-policy"
curl -sI http://localhost:3100/ | grep -i "strict-transport-security"
```

Expected after the change: both headers are present. Before the change, both greps return nothing.

- [ ] **Step 2: Add CSP and HSTS to `next.config.ts`**

Insert above `const nextConfig`:

```ts
const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.aitoolsfinder.cloud",
  "font-src 'self' data:",
  "connect-src 'self' https://aitoolsfinder.cloud",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
```

Add these entries to the existing `headers` array for `source: "/:path*"`:

```ts
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
```

`'unsafe-inline'` is required for Next.js hydration bootstrap scripts until a nonce-based middleware is added; record this tradeoff in the commit body.

- [ ] **Step 3: Self-host Inter with `next/font`**

In `frontend/src/app/layout.tsx`, add:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
```

Change the `<html>` element to include the font variable:

```tsx
    <html lang="en" className={`dark ${inter.variable}`} data-type="software">
```

- [ ] **Step 4: Point the CSS stack at the variable**

In `frontend/src/styles/globals.css` replace:

```css
  --font-sans: Inter;
```

with:

```css
  --font-sans: var(--font-inter), Inter, system-ui, -apple-system, sans-serif;
```

- [ ] **Step 5: Verify build and headers**

Run: `cd frontend && npm run build`
Expected: build succeeds.

Run the Step 1 header script.
Expected: `content-security-policy` and `strict-transport-security` are printed.

Stop the temporary server afterwards (`pkill -f "next start -p 3100"` on Unix).

- [ ] **Step 6: Commit**

```bash
git add frontend/next.config.ts frontend/src/app/layout.tsx frontend/src/styles/globals.css
git commit -m "feat: add CSP/HSTS headers and self-host Inter with font-display swap"
```

---

## Task 4: Production Compose, Nginx TLS, and rate limiting

**Files:**
- Create: `deploy/docker-compose.prod.yml`
- Create: `deploy/nginx/templates/default.conf.template`
- Delete: `deploy/nginx/conf.d/default.conf` (replaced by the template)
- Create: `deploy/scripts/init-letsencrypt.sh`
- Create: `deploy/.env.deploy.example`
- Create: `deploy/.deploy-images.env.example`

**Interfaces:**
- Consumes: static secrets in `deploy/.env.deploy` and CI-managed image tags in `deploy/.deploy-images.env` (`ECR_REGISTRY`, `BACKEND_TAG`, `FRONTEND_TAG`).
- Produces: `frontend:3000` and `backend:8000` reachable only on the Docker network and `127.0.0.1`; Nginx on 80/443.

- [ ] **Step 1: Write the production environment templates**

Create `deploy/.env.deploy.example` (copied to `.env.deploy` on the server, never overwritten by CI):

```text
DOMAIN=aitoolsfinder.cloud
LETSENCRYPT_EMAIL=ops@aitoolsfinder.cloud
AWS_REGION=us-east-1
ECR_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/postgres
DATABASE_URL_SYNC=postgresql://user:password@host:5432/postgres
CORS_ORIGINS=["https://aitoolsfinder.cloud"]
OPENROUTER_API_KEY=
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
APP_SECRET_KEY=replace-with-32-plus-random-characters
BACKUP_BUCKET=aitoolsfinder-db-backups
```

Create `deploy/.deploy-images.env.example` (CI writes this file on every deploy):

```text
BACKEND_TAG=sha-replace-me
FRONTEND_TAG=sha-replace-me
```

`ECR_REGISTRY` lives in `.env.deploy` so CI never has to rewrite this file wholesale; `deploy.sh` changes only the tag for the service being deployed.

Ensure the repository root `.gitignore` contains these entries so real deploy secrets are never committed:

```text
deploy/.env.deploy
deploy/.deploy-images.env
deploy/.deploy-images.env.previous
deploy/nginx/certs/
```

Run: `git check-ignore -v deploy/.env.deploy deploy/.deploy-images.env`
Expected: both paths match the new rules.

- [ ] **Step 2: Write the production Compose file**

Create `deploy/docker-compose.prod.yml`:

```yaml
services:
  backend:
    image: ${ECR_REGISTRY}/aitoolsfinder-backend:${BACKEND_TAG}
    restart: unless-stopped
    env_file:
      - .env.deploy
      - .deploy-images.env
    environment:
      APP_ENV: production
      PORT: 8000
      HOST: 0.0.0.0
      OFFICIAL_DOMAIN: https://${DOMAIN}
    expose:
      - "8000"
    ports:
      - "127.0.0.1:8000:8000"
    logging:
      driver: awslogs
      options:
        awslogs-region: ${AWS_REGION}
        awslogs-group: /aitoolsfinder/backend
        awslogs-stream: ${BACKEND_TAG}
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8000/api/v1/health/ready"]
      interval: 15s
      timeout: 5s
      retries: 4

  frontend:
    image: ${ECR_REGISTRY}/aitoolsfinder-frontend:${FRONTEND_TAG}
    restart: unless-stopped
    env_file:
      - .deploy-images.env
    environment:
      NODE_ENV: production
      PORT: 3000
      NEXT_PUBLIC_APP_URL: https://${DOMAIN}
      NEXT_PUBLIC_API_BASE_URL: https://${DOMAIN}/api/v1
    expose:
      - "3000"
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      backend:
        condition: service_started
    logging:
      driver: awslogs
      options:
        awslogs-region: ${AWS_REGION}
        awslogs-group: /aitoolsfinder/frontend
        awslogs-stream: ${FRONTEND_TAG}
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://localhost:3000/"]
      interval: 15s
      timeout: 5s
      retries: 4

  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    environment:
      DOMAIN: ${DOMAIN}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/templates:/etc/nginx/templates:ro
      - certbot_certs:/etc/letsencrypt:ro
      - certbot_www:/var/www/certbot:ro
    depends_on:
      - frontend
      - backend
    logging:
      driver: awslogs
      options:
        awslogs-region: ${AWS_REGION}
        awslogs-group: /aitoolsfinder/nginx
        awslogs-stream: nginx

  certbot:
    image: certbot/certbot:v3.0.1
    volumes:
      - certbot_certs:/etc/letsencrypt
      - certbot_www:/var/www/certbot
    entrypoint: sh

volumes:
  certbot_certs:
  certbot_www:
```

The 127.0.0.1 bindings exist only so `deploy.sh` can probe health from the host; they are not publicly reachable.

- [ ] **Step 3: Write the Nginx template**

Create `deploy/nginx/templates/default.conf.template`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

upstream frontend_upstream {
    server frontend:3000;
}

upstream backend_upstream {
    server backend:8000;
}

server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 5m;

    resolver 127.0.0.11 valid=10s ipv6=off;

    location /api/ {
        set $backend http://backend_upstream;
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;
        proxy_pass $backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/docs {
        set $backend http://backend_upstream;
        proxy_pass $backend/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        set $backend http://backend_upstream;
        proxy_pass $backend/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        set $frontend http://frontend_upstream;
        proxy_pass $frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`set` + variable `proxy_pass` forces Nginx to re-resolve container DNS after a rolling restart instead of caching a stale IP.

- [ ] **Step 4: Remove the old static config**

```bash
git rm deploy/nginx/conf.d/default.conf
```

- [ ] **Step 5: Write the certificate bootstrap script**

Create `deploy/scripts/init-letsencrypt.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

set -a
. ./.env.deploy
. ./.deploy-images.env
set +a

COMPOSE="docker compose -f docker-compose.prod.yml"

if $COMPOSE run --rm --entrypoint sh certbot -c \
  "test -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem" >/dev/null 2>&1; then
  echo "A certificate for ${DOMAIN} already exists; skipping issuance."
  exit 0
fi

$COMPOSE run --rm --entrypoint sh certbot -c \
  "mkdir -p /etc/letsencrypt/live/${DOMAIN} && \
   openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
     -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
     -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
     -subj '/CN=localhost'"

$COMPOSE up -d nginx

$COMPOSE run --rm --entrypoint sh certbot -c \
  "rm -rf /etc/letsencrypt/live/${DOMAIN} /etc/letsencrypt/archive/${DOMAIN} /etc/letsencrypt/renewal/${DOMAIN}.conf"

$COMPOSE run --rm --entrypoint certbot certbot certonly --webroot \
  -w /var/www/certbot \
  -d "${DOMAIN}" -d "www.${DOMAIN}" \
  --email "${LETSENCRYPT_EMAIL}" --agree-tos --no-eff-email

$COMPOSE exec nginx nginx -s reload
echo "Certificate issued for ${DOMAIN}."
```

- [ ] **Step 6: Validate Compose and Nginx config in CI**

Add this job to `.github/workflows/ci.yml` for now (it is moved to the deploy workflow in Task 7):

```yaml
  deploy-config:
    name: Validate Deployment Config
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Compose config
        working-directory: ./deploy
        run: |
          cp .env.deploy.example .env.deploy
          cp .deploy-images.env.example .deploy-images.env
          set -a
          . ./.env.deploy
          . ./.deploy-images.env
          set +a
          docker compose -f docker-compose.prod.yml config >/dev/null
      - name: Nginx config
        run: |
          mkdir -p deploy/nginx/certs
          openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
            -keyout deploy/nginx/certs/privkey.pem \
            -out deploy/nginx/certs/fullchain.pem -subj '/CN=localhost'
          docker run --rm \
            -e DOMAIN=aitoolsfinder.cloud \
            -v "$PWD/deploy/nginx/templates:/etc/nginx/templates:ro" \
            -v "$PWD/deploy/nginx/certs:/etc/letsencrypt/live/aitoolsfinder.cloud:ro" \
            nginx:1.27-alpine sh -c "envsubst '\$DOMAIN' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -t"
```

Note: the local certificate path is created only for `nginx -t`; production certificates come from the certbot volume.

Run: `cd deploy && cp .env.deploy.example .env.deploy && cp .deploy-images.env.example .deploy-images.env && set -a && . ./.env.deploy && . ./.deploy-images.env && set +a && docker compose -f docker-compose.prod.yml config >/dev/null`
Expected locally with Docker: exit 0. Without Docker, rely on the CI `deploy-config` job.

- [ ] **Step 7: Commit**

```bash
git add deploy/docker-compose.prod.yml deploy/nginx/templates/default.conf.template deploy/scripts/init-letsencrypt.sh deploy/.env.deploy.example deploy/.deploy-images.env.example .github/workflows/ci.yml
git rm --cached deploy/nginx/conf.d/default.conf
git commit -m "feat: add production compose, TLS nginx, and certificate bootstrap"
```

---

## Task 5: AWS infrastructure as code (Terraform)

**Files:**
- Create: `deploy/terraform/versions.tf`
- Create: `deploy/terraform/variables.tf`
- Create: `deploy/terraform/main.tf`
- Create: `deploy/terraform/outputs.tf`
- Create: `deploy/terraform/terraform.tfvars.example`
- Create: `deploy/terraform/.gitignore`

**Interfaces:**
- Consumes: AWS credentials with permissions to manage EC2, ECR, S3, CloudFront, IAM, Route 53, Budgets, CloudWatch Logs.
- Produces: ECR registry URL, EIP for DNS, instance profile name, log group names used by Compose.

- [ ] **Step 1: Write provider and variable files**

`deploy/terraform/versions.tf`:

```hcl
terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

`deploy/terraform/variables.tf`:

```hcl
variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "aitoolsfinder"
}

variable "instance_type" {
  type    = string
  default = "t3.medium"
}

variable "ec2_key_name" {
  type        = string
  description = "Existing EC2 key pair name used for SSH deploys"
}

variable "admin_cidr" {
  type        = string
  description = "CIDR allowed to reach SSH (for example 203.0.113.10/32)"
}

variable "domain_name" {
  type    = string
  default = "aitoolsfinder.cloud"
}

variable "repository_url" {
  type        = string
  description = "Git URL cloned by the EC2 bootstrap script"
}

variable "bucket_name" {
  type    = string
  default = "aitoolsfinder-media"
}

variable "backup_bucket_name" {
  type    = string
  default = "aitoolsfinder-db-backups"
}

variable "budget_email" {
  type        = string
  description = "Email address for AWS Budgets alerts"
}

variable "cdn_domain" {
  type    = string
  default = "cdn.aitoolsfinder.cloud"
}

variable "cdn_certificate_arn" {
  type        = string
  description = "ACM certificate ARN in us-east-1 covering cdn.<domain>"
}

variable "create_dns" {
  type    = bool
  default = false
}
```

`deploy/terraform/.gitignore`:

```text
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
crash.log
```

- [ ] **Step 2: Write the infrastructure**

`deploy/terraform/main.tf`:

```hcl
data "aws_caller_identity" "current" {}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.project}-frontend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "backend" {
  name                 = "${var.project}-backend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "untagged" {
  for_each   = { frontend = aws_ecr_repository.frontend.name, backend = aws_ecr_repository.backend.name }
  repository = each.value

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire untagged images after 14 days"
      selection = {
        tagStatus   = "untagged"
        countType   = "sinceImagePushed"
        countUnit   = "days"
        countNumber = 14
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_s3_bucket" "media" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "backups" {
  bucket = var.backup_bucket_name
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expire-old-backups"
    status = "Enabled"

    filter {
      prefix = "postgres/"
    }

    expiration {
      days = 30
    }
  }
}

resource "aws_cloudfront_origin_access_control" "media" {
  name                              = "${var.project}-media-oac"
  description                       = "OAC for private media bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "media" {
  enabled         = true
  is_ipv6_enabled = true
  aliases         = [var.cdn_domain]
  price_class     = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id                = "s3-media"
    origin_access_control_id = aws_cloudfront_origin_access_control.media.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-media"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.cdn_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

data "aws_iam_policy_document" "media_bucket" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.media.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.media.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "media" {
  bucket = aws_s3_bucket.media.id
  policy = data.aws_iam_policy_document.media_bucket.json
}

resource "aws_iam_role" "ec2" {
  name = "${var.project}-ec2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "runtime" {
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.media.arn,
          "${aws_s3_bucket.media.arn}/*",
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.backend.arn}:*",
          "${aws_cloudwatch_log_group.frontend.arn}:*",
          "${aws_cloudwatch_log_group.nginx.arn}:*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project}-ec2"
  role = aws_iam_role.ec2.name
}

resource "aws_security_group" "app" {
  name        = "${var.project}-app"
  description = "Public HTTP/HTTPS and restricted SSH"

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from admin"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.ec2_key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  vpc_security_group_ids = [aws_security_group.app.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/../scripts/bootstrap-ec2.sh", {
    repository_url = var.repository_url
  })

  tags = {
    Name = "${var.project}-app"
  }
}

resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aitoolsfinder/backend"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/aitoolsfinder/frontend"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "nginx" {
  name              = "/aitoolsfinder/nginx"
  retention_in_days = 14
}

resource "aws_budgets_budget" "monthly" {
  name         = "${var.project}-monthly"
  budget_type  = "COST"
  limit_amount = "100"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  dynamic "notification" {
    for_each = [25, 50, 100]
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = [var.budget_email]
    }
  }
}

data "aws_route53_zone" "primary" {
  count   = var.create_dns ? 1 : 0
  name    = "${var.domain_name}."
  private_zone = false
}

resource "aws_route53_record" "apex" {
  count   = var.create_dns ? 1 : 0
  zone_id = data.aws_route53_zone.primary[0].zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

resource "aws_route53_record" "www" {
  count   = var.create_dns ? 1 : 0
  zone_id = data.aws_route53_zone.primary[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.domain_name]
}

resource "aws_route53_record" "cdn" {
  count   = var.create_dns ? 1 : 0
  zone_id = data.aws_route53_zone.primary[0].zone_id
  name    = var.cdn_domain
  type    = "CNAME"
  ttl     = 300
  records = [aws_cloudfront_distribution.media.domain_name]
}
```

- [ ] **Step 3: Write outputs and example variables**

`deploy/terraform/outputs.tf`:

```hcl
output "ec2_public_ip" {
  value = aws_eip.app.public_ip
}

output "ecr_registry" {
  value = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

output "backend_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "frontend_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.media.domain_name
}

output "log_groups" {
  value = [
    aws_cloudwatch_log_group.backend.name,
    aws_cloudwatch_log_group.frontend.name,
    aws_cloudwatch_log_group.nginx.name,
  ]
}
```

`deploy/terraform/terraform.tfvars.example`:

```hcl
aws_region          = "us-east-1"
admin_cidr          = "203.0.113.10/32"
ec2_key_name        = "aitoolsfinder-deploy"
repository_url      = "git@github.com:YOUR_ORG/aitoolsfinder.git"
budget_email        = "ops@aitoolsfinder.cloud"
cdn_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/replace-me"
create_dns          = true
```

- [ ] **Step 4: Add the Terraform validation job to CI**

Append to `.github/workflows/ci.yml`:

```yaml
  terraform-validate:
    name: Terraform Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9.8"
      - name: Format
        working-directory: ./deploy/terraform
        run: terraform fmt -check -recursive
      - name: Init and validate
        working-directory: ./deploy/terraform
        run: |
          terraform init -backend=false
          terraform validate
```

Before committing, format locally so the CI check passes:

```bash
cd deploy/terraform
terraform fmt -recursive
terraform init -backend=false
terraform validate
```

Expected: `Success! The configuration is valid.`

Run in CI: `terraform fmt -check -recursive && terraform init -backend=false && terraform validate`

- [ ] **Step 5: Commit**

```bash
git add deploy/terraform .github/workflows/ci.yml
git commit -m "feat: provision AWS infrastructure with terraform"
```

---

## Task 6: EC2 bootstrap and deploy/rollback scripts

**Files:**
- Create: `deploy/scripts/bootstrap-ec2.sh`
- Create: `deploy/scripts/deploy.sh`
- Create: `deploy/scripts/rollback.sh`

**Interfaces:**
- Consumes: `/opt/aitoolsfinder/repo` checkout, `deploy/.env.deploy`, image tags `sha-*`.
- Produces: `deploy.sh <backend|frontend> <tag>` and `rollback.sh <backend|frontend>` usable over SSH.

- [ ] **Step 1: Write the bootstrap script**

Create `deploy/scripts/bootstrap-ec2.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPOSITORY_URL="${repository_url}"

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl git unzip postgresql-client awscli

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker
usermod -aG docker ubuntu

mkdir -p /opt/aitoolsfinder
if [ ! -d /opt/aitoolsfinder/repo/.git ]; then
  git clone "$REPOSITORY_URL" /opt/aitoolsfinder/repo
fi
chown -R ubuntu:ubuntu /opt/aitoolsfinder

if [ ! -f /etc/cron.d/aitoolsfinder-certbot ]; then
  cat > /etc/cron.d/aitoolsfinder-certbot <<'CRON'
0 2 * * * root cd /opt/aitoolsfinder/repo/deploy && docker compose -f docker-compose.prod.yml --env-file .env.deploy run --rm --entrypoint certbot certbot renew --quiet && docker compose -f docker-compose.prod.yml --env-file .env.deploy exec -T nginx nginx -s reload
CRON
fi

if [ ! -f /etc/cron.d/aitoolsfinder-backup ]; then
  cat > /etc/cron.d/aitoolsfinder-backup <<'CRON'
0 3 * * * root /opt/aitoolsfinder/repo/deploy/scripts/backup-db.sh >> /var/log/aitoolsfinder-backup.log 2>&1
CRON
fi

echo "Bootstrap complete."
```

Private repository note: EC2 user_data runs before any credentials exist on the host, so `git clone` of a private repo fails. Either set `repository_url` to the public HTTPS URL, or add the public half of a read-only deploy key to GitHub and extend bootstrap to fetch the private half from SSM Parameter Store (`aws ssm get-parameter --with-decryption`), write it to `/home/ubuntu/.ssh/deploy_key` with mode `0600`, and export `GIT_SSH_COMMAND="ssh -i /home/ubuntu/.ssh/deploy_key -o StrictHostKeyChecking=yes"`. Never commit the key.

- [ ] **Step 2: Write the deploy script**

Create `deploy/scripts/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SERVICE="${1:?usage: deploy.sh <backend|frontend> <tag>}"
TAG="${2:?usage: deploy.sh <backend|frontend> <tag>}"

case "$SERVICE" in
  backend) VAR_NAME="BACKEND_TAG" ;;
  frontend) VAR_NAME="FRONTEND_TAG" ;;
  *) echo "Unknown service: $SERVICE" >&2; exit 2 ;;
esac

ROOT="/opt/aitoolsfinder/repo/deploy"
cd "$ROOT"

IMAGES_FILE=".deploy-images.env"
PREVIOUS_FILE=".${VAR_NAME}.previous"
COMPOSE="docker compose -f docker-compose.prod.yml"

touch .env.deploy "$IMAGES_FILE"

replace_tag() {
  local file="$1" name="$2" value="$3"
  if grep -q "^${name}=" "$file"; then
    sed -i "s|^${name}=.*|${name}=${value}|" "$file"
  else
    printf '%s=%s\n' "$name" "$value" >> "$file"
  fi
}

# Record only this service's prior tag so the two pipelines never roll each other back.
grep "^${VAR_NAME}=" "$IMAGES_FILE" > "$PREVIOUS_FILE" || true
replace_tag "$IMAGES_FILE" "$VAR_NAME" "$TAG"

set -a
. ./.env.deploy
. "./$IMAGES_FILE"
set +a

aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

$COMPOSE pull "$SERVICE"
$COMPOSE up -d --no-deps "$SERVICE"

healthy=0
for _ in $(seq 1 30); do
  if [ "$SERVICE" = "backend" ]; then
    curl -fsS http://127.0.0.1:8000/api/v1/health/ready >/dev/null 2>&1 && healthy=1 && break
  else
    curl -fsS http://127.0.0.1:3000/ >/dev/null 2>&1 && healthy=1 && break
  fi
  sleep 2
done

if [ "$healthy" -ne 1 ]; then
  PREVIOUS_TAG="$(cut -d= -f2- "$PREVIOUS_FILE")"
  if [ -z "$PREVIOUS_TAG" ]; then
    echo "$SERVICE failed health checks and no previous tag exists." >&2
    exit 1
  fi
  echo "$SERVICE failed health checks; rolling back to $PREVIOUS_TAG." >&2
  replace_tag "$IMAGES_FILE" "$VAR_NAME" "$PREVIOUS_TAG"
  set -a
  . ./.env.deploy
  . "./$IMAGES_FILE"
  set +a
  $COMPOSE pull "$SERVICE"
  $COMPOSE up -d --no-deps "$SERVICE"
  exit 1
fi

$COMPOSE exec -T nginx nginx -s reload
echo "$SERVICE deployed with tag $TAG."
```

- [ ] **Step 3: Write the rollback script**

Create `deploy/scripts/rollback.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SERVICE="${1:?usage: rollback.sh <backend|frontend>}"
ROOT="/opt/aitoolsfinder/repo/deploy"
cd "$ROOT"

case "$SERVICE" in
  backend) VAR_NAME="BACKEND_TAG" ;;
  frontend) VAR_NAME="FRONTEND_TAG" ;;
  *) echo "Unknown service: $SERVICE" >&2; exit 2 ;;
esac

IMAGES_FILE=".deploy-images.env"
PREVIOUS_FILE=".${VAR_NAME}.previous"
COMPOSE="docker compose -f docker-compose.prod.yml"

if [ ! -s "$PREVIOUS_FILE" ]; then
  echo "No previous deployment recorded for $SERVICE." >&2
  exit 1
fi

PREVIOUS_TAG="$(cut -d= -f2- "$PREVIOUS_FILE")"
sed -i "s|^${VAR_NAME}=.*|${VAR_NAME}=${PREVIOUS_TAG}|" "$IMAGES_FILE"

set -a
. ./.env.deploy
. "./$IMAGES_FILE"
set +a

aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

$COMPOSE pull "$SERVICE"
$COMPOSE up -d --no-deps "$SERVICE"
$COMPOSE exec -T nginx nginx -s reload
echo "Rolled back $SERVICE."
```

- [ ] **Step 4: Verify shell syntax**

Run:

```bash
bash -n deploy/scripts/bootstrap-ec2.sh
bash -n deploy/scripts/deploy.sh
bash -n deploy/scripts/rollback.sh
bash -n deploy/scripts/init-letsencrypt.sh
```

Expected: no output, exit 0.

- [ ] **Step 5: Commit**

```bash
git add deploy/scripts
git commit -m "feat: add ec2 bootstrap and rolling deploy/rollback scripts"
```

---

## Task 7: GitHub Actions deploy pipeline with OIDC and rollback

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: GitHub secrets `AWS_DEPLOY_ROLE_ARN`, `EC2_HOST`, `EC2_SSH_KEY`; repo variables `AWS_REGION`; Terraform outputs `ecr_registry`.
- Produces: SHA-tagged images in ECR and a health-verified deployment of changed services.

- [ ] **Step 1: Create the OIDC deploy role once (documented command)**

Run against the AWS account (replace values):

```bash
aws iam create-role --role-name github-actions-aitoolsfinder \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Federated":"arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"token.actions.githubusercontent.com:aud":"sts.amazonaws.com"},"StringLike":{"token.actions.githubusercontent.com:sub":"repo:YOUR_ORG/aitoolsfinder:ref:refs/heads/main"}}}]}'
```

Attach a policy allowing `ecr:*` on the two repositories, `ecr:GetAuthorizationToken` on `*`, and `s3:GetObject` on the deployments bucket if one is used. Record the role ARN as the `AWS_DEPLOY_ROLE_ARN` repository secret.

- [ ] **Step 2: Write the workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Production

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      service:
        description: "Service to deploy"
        type: choice
        options: [all, backend, frontend]
        default: all

concurrency:
  group: deploy-production
  cancel-in-progress: false

permissions:
  contents: read
  id-token: write

env:
  AWS_REGION: us-east-1
  ECR_FRONTEND: aitoolsfinder-frontend
  ECR_BACKEND: aitoolsfinder-backend

jobs:
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.decide.outputs.backend }}
      frontend: ${{ steps.decide.outputs.frontend }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            backend:
              - 'backend/**'
              - 'deploy/**'
              - '.github/workflows/deploy.yml'
            frontend:
              - 'frontend/**'
              - 'deploy/**'
              - '.github/workflows/deploy.yml'
      - name: Decide services
        id: decide
        env:
          EVENT: ${{ github.event_name }}
          SERVICE: ${{ inputs.service }}
          BACKEND_CHANGED: ${{ steps.filter.outputs.backend }}
          FRONTEND_CHANGED: ${{ steps.filter.outputs.frontend }}
        run: |
          if [ "$EVENT" = "workflow_dispatch" ]; then
            case "$SERVICE" in
              all) backend=true; frontend=true ;;
              backend) backend=true; frontend=false ;;
              frontend) backend=false; frontend=true ;;
            esac
          else
            backend="$BACKEND_CHANGED"
            frontend="$FRONTEND_CHANGED"
          fi
          echo "backend=$backend" >> "$GITHUB_OUTPUT"
          echo "frontend=$frontend" >> "$GITHUB_OUTPUT"

  backend-image:
    name: Test and Publish Backend
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
          cache-dependency-path: backend/requirements.txt

      - name: Install and test
        working-directory: ./backend
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt -r requirements-dev.txt
          ruff check src tests
          ruff format --check src tests
          pytest -q

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr

      - name: Build and push
        working-directory: ./backend
        run: |
          REGISTRY="${{ steps.ecr.outputs.registry }}"
          IMAGE="$REGISTRY/${{ env.ECR_BACKEND }}:sha-${GITHUB_SHA}"
          docker build -t "$IMAGE" .
          docker push "$IMAGE"

      - name: Trivy scan
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: ${{ steps.ecr.outputs.registry }}/${{ env.ECR_BACKEND }}:sha-${{ github.sha }}
          severity: CRITICAL,HIGH
          ignore-unfixed: true
          exit-code: "1"

  frontend-image:
    name: Test and Publish Frontend
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install and verify
        working-directory: ./frontend
        run: |
          npm ci
          npm run typecheck
          npm run build
        env:
          NEXT_PUBLIC_APP_URL: https://aitoolsfinder.cloud
          NEXT_PUBLIC_API_BASE_URL: https://aitoolsfinder.cloud/api/v1

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr

      - name: Build and push
        working-directory: ./frontend
        run: |
          IMAGE="${{ steps.ecr.outputs.registry }}/${{ env.ECR_FRONTEND }}:sha-${GITHUB_SHA}"
          docker build \
            --build-arg NEXT_PUBLIC_APP_URL=https://aitoolsfinder.cloud \
            --build-arg NEXT_PUBLIC_API_BASE_URL=https://aitoolsfinder.cloud/api/v1 \
            -t "$IMAGE" .
          docker push "$IMAGE"

      - name: Trivy scan
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: ${{ steps.ecr.outputs.registry }}/${{ env.ECR_FRONTEND }}:sha-${{ github.sha }}
          severity: CRITICAL,HIGH
          ignore-unfixed: true
          exit-code: "1"

  deploy:
    name: Deploy to EC2
    needs: [changes, backend-image, frontend-image]
    if: |
      always() &&
      (needs.changes.outputs.backend == 'true' || needs.changes.outputs.frontend == 'true') &&
      (needs.backend-image.result == 'success' || needs.backend-image.result == 'skipped') &&
      (needs.frontend-image.result == 'success' || needs.frontend-image.result == 'skipped')
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr

      - name: Write image env
        run: |
          cat > .deploy-images.env <<EOF
          ECR_REGISTRY=${{ steps.ecr.outputs.registry }}
          BACKEND_TAG=sha-${{ github.sha }}
          FRONTEND_TAG=sha-${{ github.sha }}
          EOF

      - name: Copy image env to EC2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          source: .deploy-images.env
          target: /opt/aitoolsfinder/repo/deploy

      - name: Deploy backend
        if: needs.changes.outputs.backend == 'true'
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /opt/aitoolsfinder/repo
            git fetch --all && git reset --hard origin/main
            cd deploy
            bash scripts/deploy.sh backend sha-${{ github.sha }}

      - name: Deploy frontend
        if: needs.changes.outputs.frontend == 'true'
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /opt/aitoolsfinder/repo
            git fetch --all && git reset --hard origin/main
            cd deploy
            bash scripts/deploy.sh frontend sha-${{ github.sha }}

      - name: Public health gate
        run: |
          curl --retry 10 --retry-delay 3 --retry-connrefused -fsS \
            https://aitoolsfinder.cloud/api/v1/health/ready
          curl --retry 10 --retry-delay 3 --retry-connrefused -fsS \
            -o /dev/null https://aitoolsfinder.cloud/

      - name: Roll back on public health failure
        if: failure()
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /opt/aitoolsfinder/repo/deploy
            if [ "${{ needs.changes.outputs.backend }}" = "true" ]; then bash scripts/rollback.sh backend; fi
            if [ "${{ needs.changes.outputs.frontend }}" = "true" ]; then bash scripts/rollback.sh frontend; fi
```

- [ ] **Step 3: Validate YAML**

Run:

```bash
python -c "import yaml, pathlib; yaml.safe_load(pathlib.Path('.github/workflows/deploy.yml').read_text()); print('yaml ok')"
```

Expected: `yaml ok`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add OIDC production deploy pipeline with trivy scan and rollback"
```

---

## Task 8: Security audit gates

**Files:**
- Modify: `backend/src/core/security.py`
- Modify: `backend/src/modules/vendor/router.py:295-315`
- Create: `backend/tests/test_security_hardening.py`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `AffiliateLinkModel.provider_url`, `settings.CORS_ORIGINS`.
- Produces: `is_safe_outbound_url(url: str) -> bool`; outbound endpoint returns HTTP 400 for non-HTTP(S) targets.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_security_hardening.py`:

```python
import uuid

import pytest

from src.core.security import is_safe_outbound_url
from src.modules.catalog.models import ToolModel
from src.modules.vendor.models import AffiliateLinkModel


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("https://example.com/pricing", True),
        ("http://example.com", True),
        ("javascript:alert(1)", False),
        ("data:text/html;base64,PHNjcmlwdD4=", False),
        ("ftp://example.com/file", False),
        ("https://user:pass@example.com", False),
        ("/relative/path", False),
    ],
)
def test_is_safe_outbound_url(url, expected):
    assert is_safe_outbound_url(url) is expected


@pytest.mark.asyncio
async def test_outbound_rejects_unsafe_affiliate_url(client, db_session):
    tool = ToolModel(
        id=uuid.uuid4(),
        name="Unsafe redirect fixture",
        slug=f"unsafe-{uuid.uuid4()}",
        website_url="https://example.test",
    )
    db_session.add(tool)
    db_session.add(
        AffiliateLinkModel(
            tool_id=tool.id,
            provider="test",
            provider_url="javascript:alert(1)",
        )
    )
    await db_session.commit()

    response = await client.post(f"/api/v1/outbound/{tool.id}")
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_cors_rejects_untrusted_origin(client):
    response = await client.options(
        "/api/v1/categories",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.headers.get("access-control-allow-origin") is None


@pytest.mark.asyncio
async def test_search_query_treats_sql_metacharacters_as_data(client):
    response = await client.get("/api/v1/tools", params={"q": "' OR 1=1 --"})
    assert response.status_code == 200
```

- [ ] **Step 2: Run the tests to confirm failure**

Run: `cd backend && python -m pytest tests/test_security_hardening.py -v`
Expected: `ImportError: cannot import name 'is_safe_outbound_url'`.

- [ ] **Step 3: Implement the URL guard**

In `backend/src/core/security.py`, add near the top-level helpers:

```python
from urllib.parse import urlparse


def is_safe_outbound_url(url: str) -> bool:
    """Allow only absolute HTTP(S) URLs without embedded credentials."""
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False
    if not parsed.netloc:
        return False
    if parsed.username or parsed.password:
        return False
    return True
```

- [ ] **Step 4: Enforce it in the outbound endpoint**

In `backend/src/modules/vendor/router.py`, import the helper:

```python
from src.core.security import get_current_user, UserContext, require_role, is_safe_outbound_url
```

Before recording the click, add:

```python
    if not is_safe_outbound_url(affiliate_link.provider_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Affiliate link is not a safe redirect target",
        )
```

- [ ] **Step 5: Add dependency audit gates to CI**

Append to the backend job in `.github/workflows/ci.yml` after the pytest step:

```yaml
      - name: Dependency audit
        working-directory: ./backend
        run: |
          pip install pip-audit
          pip-audit -r requirements.txt
```

Append to the frontend job after the build step:

```yaml
      - name: Production dependency audit
        working-directory: ./frontend
        run: npm audit --omit=dev --audit-level=high
```

- [ ] **Step 6: Verify rate limiting and secret isolation**

Run the existing rate-limit regression:

```bash
cd backend && python -m pytest tests/test_ai_recommendations.py -k "rate or limit" -v
```

Expected: the 5×200-then-429 test passes.

Build the frontend and confirm no secret names leak into client assets:

```bash
cd frontend && npm run build
grep -R "OPENROUTER_API_KEY\|APP_SECRET_KEY\|DATABASE_URL" .next/static 2>/dev/null | head
```

Expected: grep prints nothing.

- [ ] **Step 7: Run the security tests and full suite**

Run: `cd backend && python -m pytest tests/test_security_hardening.py -v`
Expected: 10 passed (7 parametrized URL cases + outbound + CORS + SQL metacharacters).

Run: `cd backend && python -m pytest -q`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add backend/src/core/security.py backend/src/modules/vendor/router.py backend/tests/test_security_hardening.py .github/workflows/ci.yml
git commit -m "security: validate outbound redirects and add dependency audit gates"
```

---

## Task 9: Core Web Vitals gate

**Files:**
- Create: `frontend/lighthouserc.json`
- Create: `.github/workflows/lighthouse.yml`

**Interfaces:**
- Consumes: the deployed production site.
- Produces: failing CI when LCP, CLS, or total blocking time regress past the targets.

- [ ] **Step 1: Write the Lighthouse configuration**

Create `frontend/lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": [
        "https://aitoolsfinder.cloud/",
        "https://aitoolsfinder.cloud/explore",
        "https://aitoolsfinder.cloud/ai-finder"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

Lighthouse lab data does not report INP; total blocking time is the lab proxy. Confirm field INP ≤200ms in CrUX/PageSpeed Insights and record the date and URL in `docs/plans/PHASE_8_PRODUCTION_HARDENING_AND_DEPLOYMENT.md` Task 8.5 when executing.

- [ ] **Step 2: Write the workflow**

Create `.github/workflows/lighthouse.yml`:

```yaml
name: Core Web Vitals

on:
  workflow_dispatch:
  schedule:
    - cron: "0 6 * * 1"

permissions:
  contents: read

jobs:
  lighthouse:
    name: Lighthouse Production Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: ./frontend/lighthouserc.json
          uploadArtifacts: true
          temporaryPublicStorage: true
```

- [ ] **Step 3: Validate the JSON**

Run:

```bash
python -c "import json, pathlib; json.loads(pathlib.Path('frontend/lighthouserc.json').read_text()); print('json ok')"
```

Expected: `json ok`.

- [ ] **Step 4: Commit**

```bash
git add frontend/lighthouserc.json .github/workflows/lighthouse.yml
git commit -m "ci: add lighthouse core web vitals gate"
```

---

## Task 10: Observability, backups, and disaster recovery

**Files:**
- Create: `deploy/scripts/backup-db.sh`
- Create: `deploy/scripts/restore-db.sh`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/ENVIRONMENT_VARIABLES.md`

**Interfaces:**
- Consumes: `.env.deploy` with `DATABASE_URL_SYNC` and `BACKUP_BUCKET`; IAM role S3 access; CloudWatch log groups from Task 5.
- Produces: daily `s3://{BACKUP_BUCKET}/postgres/{timestamp}.dump`; documented restore drill.

- [ ] **Step 1: Write the backup script**

Create `deploy/scripts/backup-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="/opt/aitoolsfinder/repo/deploy"
set -a
. "$ROOT/.env.deploy"
set +a

: "${DATABASE_URL_SYNC:?DATABASE_URL_SYNC is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

pg_dump "$DATABASE_URL_SYNC" --format=custom --no-owner --no-privileges \
  | aws s3 cp - "s3://${BACKUP_BUCKET}/postgres/${STAMP}.dump"

echo "Backup uploaded: s3://${BACKUP_BUCKET}/postgres/${STAMP}.dump"
```

- [ ] **Step 2: Write the restore script**

Create `deploy/scripts/restore-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

DUMP_URL="${1:?usage: restore-db.sh s3://bucket/postgres/file.dump}"

ROOT="/opt/aitoolsfinder/repo/deploy"
set -a
. "$ROOT/.env.deploy"
set +a

: "${DATABASE_URL_SYNC:?DATABASE_URL_SYNC is required}"

TMP_FILE="$(mktemp /tmp/aitoolsfinder-restore-XXXXXX.dump)"
trap 'rm -f "$TMP_FILE"' EXIT

aws s3 cp "$DUMP_URL" "$TMP_FILE"
pg_restore --clean --if-exists --no-owner --no-privileges \
  -d "$DATABASE_URL_SYNC" "$TMP_FILE"

echo "Restore complete from $DUMP_URL"
```

- [ ] **Step 3: Document log groups, budgets, backup, and the restore drill**

In `docs/DEPLOYMENT.md`, add a new section:

```markdown
## 6. Observability, Cost, and Recovery

- CloudWatch log groups (14-day retention): `/aitoolsfinder/backend`, `/aitoolsfinder/frontend`, `/aitoolsfinder/nginx`.
- Container logs ship through Docker's `awslogs` driver; no log agent runs on the host.
- AWS Budgets alerts at $25, $50, and $100 (ACTUAL spend), emailed to the address in `budget_email`.
- Nightly backups: cron runs `deploy/scripts/backup-db.sh` at 03:00 UTC and writes a custom-format dump to `s3://{BACKUP_BUCKET}/postgres/{timestamp}.dump` (30-day lifecycle).
- Certificate renewal: cron runs Certbot renew at 02:00 UTC and reloads Nginx.

### Restore drill (run quarterly)

1. `aws s3 ls s3://{BACKUP_BUCKET}/postgres/ | tail -5` — pick the newest dump.
2. On a staging database: `bash deploy/scripts/restore-db.sh s3://{BACKUP_BUCKET}/postgres/<file>.dump`.
3. Verify row counts: `SELECT count(*) FROM tools;` matches production within the backup window.
4. Record the drill date and result in `docs/plans/PHASE_8_PRODUCTION_HARDENING_AND_DEPLOYMENT.md` Task 8.6.
```

In `docs/ENVIRONMENT_VARIABLES.md`, add the deployment variables:

```markdown
| `ECR_REGISTRY` | ECR registry hostname from Terraform output | `123456789012.dkr.ecr.us-east-1.amazonaws.com` |
| `BACKEND_TAG` | Backend image tag deployed by CI | `sha-<commit>` |
| `FRONTEND_TAG` | Frontend image tag deployed by CI | `sha-<commit>` |
| `BACKUP_BUCKET` | S3 bucket receiving nightly PostgreSQL dumps | `aitoolsfinder-db-backups` |
| `DOMAIN` | Public domain served by Nginx | `aitoolsfinder.cloud` |
| `LETSENCRYPT_EMAIL` | Let's Encrypt registration and expiry email | `ops@aitoolsfinder.cloud` |
```

- [ ] **Step 4: Verify scripts and docs**

Run:

```bash
bash -n deploy/scripts/backup-db.sh
bash -n deploy/scripts/restore-db.sh
grep -q "Restore drill" docs/DEPLOYMENT.md
grep -q "BACKUP_BUCKET" docs/ENVIRONMENT_VARIABLES.md
```

Expected: exit 0 for all four commands.

- [ ] **Step 5: Commit**

```bash
git add deploy/scripts/backup-db.sh deploy/scripts/restore-db.sh docs/DEPLOYMENT.md docs/ENVIRONMENT_VARIABLES.md
git commit -m "ops: add database backups, restore drill, and deployment env documentation"
```

---

## Task 11: End-to-end journey test and launch checklist

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/journey.spec.ts`
- Modify: `.github/workflows/deploy.yml`
- Modify: `docs/plans/PHASE_8_PRODUCTION_HARDENING_AND_DEPLOYMENT.md`
- Modify: `docs/plans/README.md`

**Interfaces:**
- Consumes: `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`) and `API_BASE_URL` (default `https://aitoolsfinder.cloud/api/v1`).
- Produces: a browser journey covering catalog → tool → compare → AI Finder → outbound redirect.

- [ ] **Step 1: Install Playwright**

Run:

```bash
cd frontend
npm install --save-dev @playwright/test@1.49.1
npx playwright install chromium
```

Expected: `package.json` and `package-lock.json` update.

- [ ] **Step 2: Write the Playwright config**

Create `frontend/playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
});
```

- [ ] **Step 3: Write the journey test**

Create `frontend/e2e/journey.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const apiBase =
  process.env.API_BASE_URL ?? "https://aitoolsfinder.cloud/api/v1";

test("catalog, tool detail, compare, ai finder, and outbound", async ({
  page,
  request,
}) => {
  await page.goto("/explore");
  const firstTool = page.locator('a[href^="/tools/"]').first();
  await expect(firstTool).toBeVisible();
  await firstTool.click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const catalog = await request.get(`${apiBase}/tools?page_size=2`);
  const catalogBody = await catalog.json();
  const tools = (catalogBody.items ?? []) as Array<{ id: string; slug: string }>;
  expect(tools.length).toBeGreaterThan(0);

  if (tools.length >= 2) {
    await page.goto(`/compare/preview?tool=${tools[0].slug}&tool=${tools[1].slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  await page.goto("/ai-finder");
  await page
    .getByRole("textbox", { name: /describe what you need/i })
    .fill("Best AI tool for podcast transcripts");
  await page.getByRole("button", { name: /find tools/i }).click();
  await expect(
    page.getByText(/tools found|No tools match|temporarily unavailable/i).first(),
  ).toBeVisible({ timeout: 30_000 });

  const outbound = await request.post(`${apiBase}/outbound/${tools[0].id}`, {
    failOnStatusCode: false,
  });
  expect([200, 404]).toContain(outbound.status());
});
```

- [ ] **Step 4: Add the post-deploy E2E job**

Append to `.github/workflows/deploy.yml`:

```yaml
  e2e:
    name: Production Journey
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install Playwright
        working-directory: ./frontend
        run: |
          npm ci
          npx playwright install --with-deps chromium

      - name: Run journey
        working-directory: ./frontend
        env:
          PLAYWRIGHT_BASE_URL: https://aitoolsfinder.cloud
          API_BASE_URL: https://aitoolsfinder.cloud/api/v1
        run: npx playwright test
```

- [ ] **Step 5: Verify the test list compiles**

Run: `cd frontend && npx playwright test --list`
Expected: one test listed (`journey.spec.ts`), exit 0.

Run: `cd frontend && npm run typecheck`
Expected: pass (Playwright types are available from the dev dependency).

- [ ] **Step 6: Update the Phase 8 checklist and roadmap on completion**

Only after Tasks 1–10 have passed their verification:

- In `docs/plans/PHASE_8_PRODUCTION_HARDENING_AND_DEPLOYMENT.md`, set `Status: Completed & Verified`, tick Tasks 8.1–8.6, and append a `### Verification record` section listing the commands run, their results, the deploy run URL, the Lighthouse report URL, and the restore-drill date.
- In `docs/plans/README.md`, mark Phase 8 as **Completed & Verified**.
- In `docs/DEVELOPMENT_ROADMAP.md`, append `(Completed & Verified)` to the Phase 8 heading.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/playwright.config.ts frontend/e2e/journey.spec.ts .github/workflows/deploy.yml docs/plans/PHASE_8_PRODUCTION_HARDENING_AND_DEPLOYMENT.md docs/plans/README.md docs/DEVELOPMENT_ROADMAP.md
git commit -m "test: add production journey e2e and finalize phase 8 checklist"
```

---

## Execution Order and Gates

| Order | Task | Independent gate |
| --- | --- | --- |
| 1 | Pre-flight backend fixes | `pytest -q` |
| 2 | Standalone Next build | `.next/standalone/server.js` exists |
| 3 | CSP/HSTS and fonts | curl header check |
| 4 | Prod Compose/Nginx/TLS | `docker compose config`, `nginx -t` (CI) |
| 5 | Terraform | `terraform validate` (CI) |
| 6 | Bootstrap/deploy scripts | `bash -n` |
| 7 | Deploy workflow | `yaml.safe_load` + real deploy |
| 8 | Security audit | `pytest tests/test_security_hardening.py` |
| 9 | Lighthouse gate | Lighthouse run on production |
| 10 | Backups/DR | scripts parse + restore drill |
| 11 | E2E journey | `npx playwright test` |

Tasks 1–3 are safe to run in any order after Task 1. Task 4 depends on Task 2 for a working frontend image. Task 5 must complete before Task 7's first real deploy. Task 11's E2E requires a seeded production catalog; if production has no published tools, seed the taxonomy and at least five published tools first.
