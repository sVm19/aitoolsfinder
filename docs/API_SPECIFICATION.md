# API Specification — AIToolsFinder.cloud

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**API Base URL:** `https://aitoolsfinder.cloud/api/v1`  
**OpenAPI Documentation:** `https://aitoolsfinder.cloud/api/docs` (or `/docs`)

---

## 1. Conventions & Standards

- **Base Path:** `/api/v1`
- **Format:** JSON request and response payloads.
- **Identifiers:** Standard UUID v4 strings (`36-character hyphenated`).
- **Timestamps:** ISO 8601 strings in UTC (`YYYY-MM-DDTHH:MM:SSZ`).
- **Monetary Values:** Integer minor units (`amount_minor` e.g., `2900` = $29.00) + 3-char ISO currency code (`currency = 'USD'`).
- **Pagination Envelope:** Standardized bounded list response (`page`, `page_size`, `total`, `total_pages`).
- **Standard Error Envelope:** `{ "error": { "code": "STRING", "message": "STRING", "request_id": "UUID" } }`.
- **Correlation ID:** Every response includes `X-Request-ID` and `X-Response-Time-Ms`.
- **Security:** Public catalog endpoints require no auth; protected endpoints require AWS Cognito JWT bearer token.

---

## 2. Standard Envelope Patterns

### List Response:
```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 100,
  "total_pages": 5
}
```

### Error Response:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload failed schema validation.",
    "request_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
}
```

---

## 3. Endpoints by Modular Domain

### 3.1 Health & Operations
- `GET /health/live`: Liveness probe (HTTP 200).
- `GET /health/ready`: Readiness probe (verifies database pool connectivity).

### 3.2 Catalog (Categories, Tags, Tools, Features, Pricing)
- `GET /categories`: Active categories taxonomy.
- `GET /categories/{slug}`: Category metadata and associated tools.
- `GET /tags`: Active tags list.
- `GET /tags/{slug}`: Tools filtered by tag.
- `GET /tools`: Filterable, paginated tool discovery (`q`, repeated or comma-separated `category` and `tags`, `pricing_model`, `is_verified`, `sort`). Multiple category/tag selections match any selected slug. Supported sorts are `relevance`, `newest`, and `alphabetical`; trending and rated sorts await engagement and rating data.
- `GET /tools/{slug}`: Published tool detail profile.

### 3.3 Search & Discovery
- `GET /search`: Full-text search with typo tolerance, filters, and relevance ranking; uses the same paginated envelope as `/tools`.
- `GET /search/autocomplete?q=...`: Up to ten published tool name suggestions, ordered by approximate name match.

### 3.4 Intelligence & Comparisons
- `GET /comparisons/{slug}`: Published comparison with ordered published tools, normalized feature support (`yes`, `partial`, `no`, `unknown`), and pricing plans grouped by tool slug.
- `POST /comparisons/preview`: Ephemeral comparison matrix. Accepts `tool_slugs` containing 2–4 distinct published tool slugs; does not create a comparison record.
- `GET /tools/{slug}/alternatives`: Published curated alternatives followed by published tools with overlapping categories or tags. Curated records include their stored rationale; related suggestions report overlap counts.
- `GET /rankings/{slug}`: Category or tag leaderboard from the latest stored score snapshot per published tool. Accepts `taxonomy_type=category|tag` (default `category`), `pricing_filter=all|free|paid`, `page`, and `page_size`; free includes free and freemium, paid includes paid/usage-based/contact-sales, and unknown pricing is omitted from filtered views. Sponsored tools are flagged and ranked separately from organic tools.

### 3.5 AI Recommendations (OpenRouter)
- `POST /recommendations`: Natural-language requirement matching anchored in internal tool IDs.
  - Request: `query` (1–1000 chars, required), optional `category_slugs` (≤5), `tag_slugs` (≤5), `pricing_model` (`free`, `freemium`, `paid`, `usage_based`, `one_time`, `contact_sales`, `unknown`), and `limit` (1–15, default 15). Extra fields are rejected.
  - Response: `items[]` (`tool_id`, `slug`, `name`, `tagline`, `match_score` 0–100, `match_score_method`, `match_reasons[]`, `tradeoffs[]`, `relevant_feature_slugs[]`, `pricing[]`, `website_url`, `is_verified`, `last_verified_at`), plus `personalized`, `notice`, `prompt_version`, `latency_ms`.
  - `match_score` is relative within the result set (`rank_relative_v1`: top 100, last 55); do not compare scores across queries.
  - Rate limit: **5 requests/minute per IP**. Exceeding it returns `429` with `Retry-After: 60` and the standard error envelope (`code: RATE_LIMITED`).
  - If the provider is unavailable or output references unknown catalog IDs/feature slugs, the endpoint returns catalog-derived results with `personalized: false` and a `notice`.
- `POST /recommendations/feedback`: Accuracy feedback (`rating` 1–5 required; optional `query` ≤1000 and `comment` ≤500) for a published `tool_id`. Returns `201` with `id`, `tool_id`, `rating`, `created_at`; unknown/unpublished tools return `404`.

### 3.6 Identity & User
- `GET /users/me`: Current user profile.
- `PATCH /users/me`: Update user display name and preferences.
- `GET /users/me/saved-tools`: User's bookmarked tools list.
- `POST /users/me/saved-tools/{tool_id}`: Bookmark a tool.
- `DELETE /users/me/saved-tools/{tool_id}`: Remove bookmark.

### 3.7 Vendor & Submissions
- `POST /submissions`: Submit a tool for editorial moderation.
- `GET /vendors/me`: Vendor profile details.
- `GET /vendors/me/submissions`: Status of submitted tools.

### 3.8 Monetization & Payments
- `GET /outbound/{tool_id}`: Safe affiliate redirect with open-redirect validation.
- `POST /payments/checkout`: Create vendor checkout session (post-verification).
- `POST /webhooks/tiun`: Cryptographically verified, idempotent payment webhook processor.
- `GET /subscriptions/me`: User/Vendor subscription status.

### 3.9 Administrative Console (Admin Role Required)
- `POST /admin/tools`: Create new tool record.
- `PATCH /admin/tools/{id}`: Update tool metadata.
- `POST /admin/tools/{id}/publish`: Publish tool to public catalog.
- `POST /admin/tools/{id}/archive`: Soft-archive tool.
- `GET /admin/submissions`: Pending tool submissions queue.
- `POST /admin/submissions/{id}/approve`: Approve and promote submission to live tool.
- `POST /admin/submissions/{id}/reject`: Reject submission with internal moderation notes.
- CRUD endpoints for `categories`, `tags`, and `features`.
