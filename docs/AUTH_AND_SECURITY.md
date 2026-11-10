# Authentication and Security — AIToolsFinder.cloud

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Authentication Provider:** AWS Cognito (User Pools + JWKS JWT Validation)

---

## 1. Identity & Token Validation

1. **Cognito User Pool:** Acts as the external identity provider.
2. **Backend JWT Validation:** FastAPI validates every bearer token:
   - Cryptographic signature against Cognito JWKS (cached in-memory with automatic refresh).
   - Expected issuer (`https://cognito-idp.{region}.amazonaws.com/{pool_id}`).
   - Audience / client ID matching `COGNITO_APP_CLIENT_ID`.
   - Expiration (`exp`) and token use (`id` or `access`).
3. **Internal User Mapping:** Internal user records in Supabase/PostgreSQL are mapped to the stable Cognito subject identifier (`cognito_sub`).

---

## 2. Authorization & Role Boundaries

Enforce all permissions server-side inside FastAPI service dependencies:
- **Public Visitor:** Can search, browse, view published tools, categories, comparisons, and rankings. No token required.
- **Authenticated User (`role: 'user'`):** Can save tools to dashboard, create comparison sets, manage profile settings.
- **Vendor (`role: 'vendor'`):** Can submit tools for moderation, view own submissions, and manage vendor profile.
- **Administrator (`role: 'admin'`):** Can perform catalog CRUD, moderate/publish tool submissions, edit pricing plans, and inspect audit logs.

---

## 3. Network & Infrastructure Security

- **Restricted Public Ports:** Only ports **80** (HTTP redirect) and **443** (HTTPS) are exposed to the public internet via the EC2 Security Group.
- **Restricted Administrative Access:** SSH access (port 22) is restricted strictly to designated administrator IP addresses.
- **Internal Docker Network:** Frontend (port 3000) and backend (port 8000) communicate over an isolated Docker bridge network. They are not directly addressable from outside the EC2 host.
- **S3 & Media Delivery:** The `aitoolsfinder-media` S3 bucket has public access completely blocked. Media is delivered exclusively through AWS CloudFront using **Origin Access Control (OAC)**.
- **Keyless AWS Authentication:**
  - Production EC2 instance utilizes an **IAM Instance Profile** with least-privilege permissions (no static AWS keys stored on disk).
  - GitHub Actions CI/CD utilizes **GitHub OIDC** with temporary STS tokens (zero long-lived AWS secrets stored in GitHub repository settings).
- **Security Headers:** Enforced on Nginx and FastAPI:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

---

## 4. Application Protection & Privacy

- **SQL Injection Prevention:** Parameterized ORM queries via SQLAlchemy 2.0; zero raw string interpolation.
- **SSRF & Open Redirect Prevention:** Outbound click redirect endpoints strictly validate target destination hostnames against verified tool records.
- **Rate Limiting:** Enforced on search, auth-adjacent, and OpenRouter AI endpoints.
- **Payment Security:** Raw card data is never accepted, transmitted, or stored. Webhook payloads from Tiun Business require signature verification and deduplication against `payment_events`.
- **Data Minimization:** No unnecessary user personal data is logged or transmitted to OpenRouter.
