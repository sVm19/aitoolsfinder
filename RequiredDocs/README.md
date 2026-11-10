# AI Tool Intelligence Platform — Project Documentation

This repository contains the product and engineering specifications for the AI Tool Intelligence Platform.

## Product goal
Help people discover, compare, evaluate, and choose AI tools, GPTs, and SaaS products for specific jobs. The platform is an intelligence-led discovery product, not merely a directory.

## Source of truth
Read documents in this order before implementing a feature:

1. `docs/PRD.md`
2. `docs/SYSTEM_ARCHITECTURE.md`
3. `docs/DATABASE_SCHEMA.md`
4. `docs/API_SPECIFICATION.md`
5. `docs/UI_UX_GUIDELINES.md` and `docs/DESIGN_SYSTEM.md`
6. `docs/ANTIGRAVITY_RULES.md`
7. Relevant feature-specific documents

If two documents conflict, do not silently choose. Flag the conflict and ask for a decision. Update the relevant documents after an approved change.

## Stack
- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Three.js / React Three Fiber, GSAP
- Backend: Python, FastAPI, Pydantic, SQLAlchemy, Alembic, Uvicorn
- Database: PostgreSQL
- Authentication: AWS Cognito
- Infrastructure: AWS EC2, S3, CloudFront, IAM, CloudWatch
- Runtime: Docker, Docker Compose, Nginx
- CI/CD: GitHub Actions
- AI: OpenRouter
- Payments: Tiun Business (subject to API, webhook, subscription and refund capability verification)
- Email: Resend
- Analytics: PostHog

## Initial engineering principles
- Build a modular monolith, not microservices.
- Keep frontend and backend as separately deployable applications in one monorepo.
- PostgreSQL is the source of truth for platform data.
- Public discovery pages must work without authentication.
- Never trust client-supplied prices, roles, payment status, scores or vendor verification.
- Keep secrets out of source control.
- Implement only the current milestone; do not scaffold every future feature prematurely.

## Project status
This pack defines the intended product and initial architecture. It is not evidence that integrations, credentials, AWS resources, payment provider capabilities or production infrastructure have been configured.
