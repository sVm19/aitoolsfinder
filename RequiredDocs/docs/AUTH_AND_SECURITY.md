# Authentication and Security

## 1. Identity
AWS Cognito manages authentication. The application maintains its own user profile keyed to Cognito `sub`.

## 2. Token validation
FastAPI must validate:
- JWT signature using Cognito JWKS
- Issuer
- Audience/client ID as appropriate
- Expiration and not-before
- Token use and relevant claims

Cache JWKS safely and refresh when key rotation requires it.

## 3. Authorization
- Public visitor: read published catalog.
- User: manage own profile, saved tools and preferences.
- Vendor: manage own vendor profile and submissions only.
- Admin: manage catalog, moderation and operational actions.

Enforce all permissions in backend services/dependencies. Never rely on hidden UI controls.

## 4. Application security
- HTTPS only in production.
- Secrets in environment/secret management, never committed.
- Least-privilege IAM role for EC2.
- Private S3 bucket with CloudFront OAC.
- Restrictive CORS and security headers.
- Input validation and output encoding.
- Rate limiting.
- Request size limits.
- Protection against SQL injection through parameterized ORM queries.
- SSRF and open-redirect protections for URL-fetching and outbound redirect features.
- Dependency and container scanning.
- Audit logs for administrative and payment actions.

## 5. Payments
- Never store card details.
- Verify webhook signatures.
- Deduplicate provider event IDs.
- Process webhooks idempotently.
- Verify amount, currency, product and user association server-side.
- Treat provider webhook state as authoritative.
- Do not trust a frontend success redirect.

## 6. Privacy
Collect only required personal data. Define retention and deletion policies. Avoid sending personal information to AI providers unless necessary and disclosed. Provide appropriate privacy and cookie notices.

## 7. Operations
- Rotate credentials.
- Patch OS and dependencies.
- Back up database.
- Test restore process.
- Monitor authentication failures, 4xx/5xx rates and unusual traffic.
- Document incident response and rollback procedures.
