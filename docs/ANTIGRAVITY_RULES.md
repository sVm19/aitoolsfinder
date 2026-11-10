# Antigravity — Project Rules and Working Agreement

You are the senior implementation agent for this repository. Follow the project documentation as the source of truth.

## 1. Before coding
1. Read `README.md` and all relevant files in `docs/`.
2. Inspect the existing repository before changing anything.
3. Identify the current milestone in `docs/DEVELOPMENT_ROADMAP.md`.
4. Summarize the intended change, files affected, dependencies and risks.
5. If requirements conflict or an important decision is missing, ask before making an irreversible assumption.

## 2. Engineering rules
- Use the approved stack: Next.js + TypeScript, FastAPI + Python, PostgreSQL, SQLAlchemy, Alembic, Cognito, AWS S3/CloudFront, Docker and GitHub Actions.
- Use a modular monolith.
- Keep frontend and backend responsibilities separate.
- Keep business logic out of route handlers and React presentation components.
- Use typed request/response schemas.
- Use repository/service boundaries consistently.
- Use migrations for every database schema change.
- Prefer small, reviewable changes over broad rewrites.
- Do not add dependencies without explaining why.
- Do not introduce Redis, Kubernetes, microservices or extra databases without evidence and approval.

## 3. Frontend rules
- Use App Router and TypeScript.
- Prefer server components for content pages; use client components only for interactivity.
- Build reusable accessible components.
- Follow `DESIGN_SYSTEM.md` and `UI_UX_GUIDELINES.md`.
- Use brand colors: `#010102`, `#7022FC`, `#FD8F32`.
- Use semantic color tokens rather than hardcoding colors repeatedly.
- Lazy-load Three.js and avoid loading it on pages that do not need it.
- Respect reduced-motion preferences and clean up GSAP timelines/resources.
- Include loading, empty, error and success states.
- Do not put secrets in client components or `NEXT_PUBLIC_` variables.

## 4. Backend rules
- Use FastAPI, Pydantic, SQLAlchemy and Alembic.
- Keep endpoints thin; business rules belong in services.
- Validate all input and external provider responses.
- Enforce authentication and authorization server-side.
- Use pagination and bounded query sizes.
- Add structured logs and request IDs.
- Do not leak stack traces or secrets in API responses.
- External integrations must use adapter modules and timeouts.

## 5. Data and AI rules
- PostgreSQL is the source of truth.
- Preserve taxonomy display names from supplied category and tag files; normalize slugs carefully.
- Do not fabricate tool data, prices, features, reviews, ratings or benchmarks.
- AI recommendations must reference actual published tool IDs.
- Clearly separate match score, intelligence score, popularity and sponsored status.
- Store score methodology/version and supporting evidence.
- Mark stale or unknown information rather than guessing.

## 6. Security rules
- Never commit secrets, credentials, tokens or real `.env` files.
- Use least-privilege IAM.
- Keep S3 private and use CloudFront OAC.
- Verify Cognito JWTs in the backend.
- Verify payment webhook signatures and make processing idempotent.
- Do not trust client payment state, roles or prices.
- Protect against SSRF and open redirects.
- Add tests for authorization boundaries.

## 7. Testing and completion
For each change:
- Add or update tests.
- Run relevant lint/type checks and tests.
- Run production build where applicable.
- Review migration safety.
- Report exact commands run and results.
- List changed files and known limitations.
- Do not claim tests passed unless they were actually run.

## 8. Documentation maintenance
When implementation changes architecture, API contracts, schema, environment variables or user flows, update the corresponding Markdown document in the same task.

## 9. Work cadence
Work one milestone or a clearly bounded subtask at a time. Do not generate the entire application in one prompt. First propose a plan; then implement; then test; then summarize.
