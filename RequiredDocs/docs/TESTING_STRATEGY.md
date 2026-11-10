# Testing Strategy

## 1. Testing pyramid
- Unit tests: domain services, scoring functions, validators and utilities.
- Integration tests: API + database, repositories and provider adapters.
- End-to-end tests: critical user journeys in a real browser.
- Performance tests: search, catalog listing and tool detail endpoints.

## 2. Frontend
Suggested tools: Vitest, React Testing Library and Playwright.
Test:
- Navigation and responsive menus
- Search input and filter state
- Tool card actions
- Tool profile rendering
- Comparison flow
- Authentication state
- Loading, empty and error states
- Keyboard and reduced-motion behavior

## 3. Backend
Suggested tools: Pytest and HTTPX.
Test:
- Pydantic validation
- Service and repository logic
- Authorization and role boundaries
- Pagination and filtering
- Search relevance behavior
- Scoring determinism
- Webhook signature and idempotency
- External-provider timeouts and failure handling

## 4. Critical end-to-end journeys
1. Visitor searches and opens a published tool.
2. Visitor filters tools by category and pricing model.
3. Visitor compares two published tools.
4. User signs in and saves a tool.
5. Vendor submits a listing and sees pending status.
6. Admin approves a submission and listing becomes public.
7. Payment webhook is received twice but applied once.

## 5. Quality gates
A pull request should not merge if required lint, type checks, tests or build fail. Add security scanning and review database migrations. Do not use production customer data in test environments.
