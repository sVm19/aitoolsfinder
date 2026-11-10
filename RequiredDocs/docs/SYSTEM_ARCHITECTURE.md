# System Architecture

## 1. Architecture style
Use a modular monolith with two primary applications:
- Next.js web application
- FastAPI backend

Deploy them as separate Docker containers. Keep domain logic inside clearly bounded backend modules. Do not split modules into microservices until a measured scaling or ownership need exists.

## 2. Logical architecture

```text
Browser
  |
  | HTTPS
  v
Nginx / TLS termination
  |------------------------------|
  v                              v
Next.js                         FastAPI
  |                              |
  | Server-side API calls        | Domain services
  |                              |
  |                         SQLAlchemy
  |                              |
  |                         PostgreSQL
  |
  |---- AWS Cognito (authentication)
  |---- CloudFront -> private S3 (static media)
  |---- OpenRouter (AI features)
  |---- Tiun Business (payments, after verification)
  |---- Resend (transactional email)
```

## 3. Deployment topology
Initial single-EC2 deployment:
- Nginx reverse proxy
- Next.js container
- FastAPI container
- Optional worker process/container
- PostgreSQL only if deliberately self-hosted; otherwise use a managed PostgreSQL provider
- S3 for object storage
- CloudFront for media delivery

Do not assume EC2 free usage includes every resource or data-transfer charge. Configure budgets, alerts, backups and least-privilege IAM.

## 4. Backend module boundaries
- catalog: tools, categories, tags, features
- discovery: search, filters, recommendations
- intelligence: scoring, rankings, comparisons, alternatives
- monetization: affiliate links, vendor plans, payment records
- identity: user profiles, roles, saved tools
- editorial: articles and curated collections
- operations: admin actions, audit logs, analytics events
- integrations: AWS, OpenRouter, Tiun Business, Resend

Each module should own its schemas, service logic and repository/data access. Avoid circular imports.

## 5. Request flow
1. Browser requests a page.
2. Next.js renders public SEO content server-side.
3. Next.js calls FastAPI using a typed API client.
4. FastAPI validates request and applies rate limits.
5. Service layer executes business rules.
6. Repository layer accesses PostgreSQL.
7. API returns a documented response schema.
8. Next.js renders the result and records permitted analytics events.

## 6. Authentication and authorization
- Cognito is the identity provider.
- Backend validates JWT signature, issuer, audience/client ID, expiry and token use.
- Map Cognito subject (`sub`) to an internal user record.
- Enforce roles and permissions in FastAPI, never only in the UI.
- Public catalog reads do not require login.
- Admin and vendor operations require explicit authorization.

## 7. Background work
Start with a separate worker process using APScheduler only for simple scheduled jobs. Ensure jobs are idempotent and safe if retried. Do not run the same scheduler in every web worker. If workload grows, adopt a durable queue and worker system.

## 8. Caching
- Begin with HTTP caching and Next.js caching where safe.
- Cache public category and tool data with explicit invalidation.
- Do not cache user-specific or authorization-sensitive responses publicly.
- Add Redis only when metrics show a need.

## 9. Reliability
- Health endpoints: `/health/live` and `/health/ready`.
- Structured logs with request IDs.
- Timeouts and bounded retries for external services.
- Idempotency for payment webhooks and other retryable events.
- Database backups and tested restore procedure.
- Graceful shutdown and container restart policies.

## 10. Architecture constraints
- No secrets in frontend bundles.
- No direct browser access to privileged AWS credentials.
- Use IAM roles for EC2-to-AWS access.
- Keep S3 buckets private and use CloudFront Origin Access Control.
- Do not expose PostgreSQL publicly.
