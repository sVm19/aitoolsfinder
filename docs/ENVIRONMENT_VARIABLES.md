# Environment Variables — AIToolsFinder.cloud

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
This document specifies all expected environment variables for the `frontend/` and `backend/` applications. Real values belong strictly in local `.env` files or secure parameter stores (e.g., AWS Secrets Manager) and must never be committed to Git.

---

## 1. Backend Application (`backend/`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `APP_ENV` | Application runtime environment (`development`, `staging`, `production`) | `production` |
| `APP_SECRET_KEY` | Cryptographic secret for signing internal tokens and session data | Random 32+ character hex string |
| `PORT` | Uvicorn server binding port (internal to Docker network) | `8000` |
| `HOST` | Uvicorn host binding | `0.0.0.0` |
| `LOG_LEVEL` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `INFO` |
| `OFFICIAL_DOMAIN` | Canonical domain for CORS and metadata verification | `https://aitoolsfinder.cloud` |
| `CORS_ORIGINS` | JSON-encoded list of allowed origins | `["https://aitoolsfinder.cloud","http://localhost:3000"]` |
| `DATABASE_URL` | Async PostgreSQL connection string (Supabase Session Pooler or local) | `postgresql+asyncpg://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres?ssl=require` |
| `DATABASE_URL_SYNC`| Sync PostgreSQL connection string for Alembic migrations | `postgresql+psycopg://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require` |
| `DB_SSL_MODE` | Optional explicit SSL parameter (`require`) | `require` |
| `SUPABASE_URL` | Optional Supabase project API URL | `https://[PROJECT-REF].supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon public API key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role administrative key | `eyJhbGciOi...` |
| `COGNITO_REGION` | AWS Region for Cognito User Pool | `us-east-1` |
| `COGNITO_USER_POOL_ID` | Cognito User Pool Identifier | `us-east-1_examplepool` |
| `COGNITO_APP_CLIENT_ID`| Cognito App Client Identifier | `exampleappclientid123456789` |
| `COGNITO_DOMAIN` | Cognito hosted/custom authentication domain | `auth.aitoolsfinder.cloud` |
| `AWS_REGION` | AWS Region for S3, CloudFront, ECR, and CloudWatch | `us-east-1` |
| `S3_BUCKET_NAME` | Private S3 media bucket | `aitoolsfinder-media` |
| `CLOUDFRONT_DOMAIN` | CDN distribution hostname for static assets | `cdn.aitoolsfinder.cloud` |
| `OPENROUTER_API_KEY` | Secret API key for OpenRouter AI recommendations | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | Target foundation model on OpenRouter | `anthropic/claude-3.5-sonnet` |
| `OPENROUTER_TIMEOUT_SECONDS` | Per-request timeout for OpenRouter calls | `10` |
| `OPENROUTER_MAX_RETRIES` | Maximum retries for transient OpenRouter failures | `2` |
| `GROQ_API_KEY` | Optional Groq API key; requires the `groq` SDK, otherwise the service uses OpenRouter | `gsk_...` |
| `GROQ_MODEL` | Groq model used when the Groq adapter is enabled | `meta-llama/llama3-8b-8192` |
| `TIUN_API_KEY` | Secret API key for Tiun Business payments (post-verification) | `tiun_live_...` |
| `TIUN_WEBHOOK_SECRET` | Secret for verifying incoming Tiun webhook signatures | `whsec_...` |
| `RESEND_API_KEY` | Transactional email provider API key | `re_...` |
| `EMAIL_FROM` | Verified sender address for transactional alerts | `notifications@aitoolsfinder.cloud` |
| `POSTHOG_API_KEY` | Product telemetry analytics key | `phc_...` |
| `POSTHOG_HOST` | PostHog instance host | `https://app.posthog.com` |

---

## 2. Frontend Application (`frontend/`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Public canonical base URL (Hardcoded to official domain) | `https://aitoolsfinder.cloud` |
| `NEXT_PUBLIC_API_BASE_URL` | Public/client-accessible backend REST endpoint | `https://aitoolsfinder.cloud/api/v1` (prod) or `http://localhost:8000/api/v1` (dev) |
| `NEXT_PUBLIC_COGNITO_REGION` | Public AWS Region for browser authentication flow | `us-east-1` |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Public Cognito User Pool ID | `us-east-1_examplepool` |
| `NEXT_PUBLIC_COGNITO_APP_CLIENT_ID`| Public Cognito App Client ID | `exampleappclientid123456789` |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public PostHog analytics key | `phc_...` |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public PostHog instance host | `https://app.posthog.com` |

> **Security Rule:** Never prefix database passwords, secret keys, or provider tokens with `NEXT_PUBLIC_`.

---

## 3. Production Deployment (`deploy/.env.deploy`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `ECR_REGISTRY` | ECR registry hostname from Terraform output | `123456789012.dkr.ecr.us-east-1.amazonaws.com` |
| `BACKEND_TAG` | Backend image tag deployed by CI | `sha-<commit>` |
| `FRONTEND_TAG` | Frontend image tag deployed by CI | `sha-<commit>` |
| `BACKUP_BUCKET` | S3 bucket receiving nightly PostgreSQL dumps | `aitoolsfinder-db-backups` |
| `DOMAIN` | Public domain served by Nginx | `aitoolsfinder.cloud` |
| `LETSENCRYPT_EMAIL` | Let's Encrypt registration and expiry email | `ops@aitoolsfinder.cloud` |
