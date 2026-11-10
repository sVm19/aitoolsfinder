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
- `GET /comparisons/{slug}`: Pre-computed public comparison page.
- `POST /comparisons/preview`: Ephemeral multi-tool feature comparison matrix.
- `GET /tools/{slug}/alternatives`: Curated and algorithmic tool alternatives.
- `GET /rankings/{slug}`: Category leaderboard rankings.

### 3.5 AI Recommendations (OpenRouter)
- `POST /recommendations`: Natural-language requirement matching anchored in internal tool IDs.
- `POST /recommendations/feedback`: Thumbs up/down accuracy feedback.

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
