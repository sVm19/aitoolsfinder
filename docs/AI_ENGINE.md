# AI Engine Specification

## 1. Purpose
Use AI to help users describe a task and discover relevant tools. AI supports discovery; it does not replace the verified catalog or create unsupported claims.

## 2. Initial flow
1. User enters a goal, constraints and preferences.
2. Backend validates and normalizes the request.
3. Retrieval searches the catalog using structured filters and text relevance.
4. Candidate tools are assembled from published records only.
5. OpenRouter model receives bounded candidate data and user requirements.
6. Model returns structured recommendations referencing candidate IDs.
7. Backend validates IDs and factual fields against PostgreSQL.
8. UI shows ranked results, explanation and limitations.

The current service limits retrieval to 15 published catalog candidates, loads their catalog relationships before binding the prompt context, and rejects generated tool IDs or feature slugs outside that candidate set. If the provider fails or returns invalid output, it returns the deterministic catalog search results with a notice; an empty candidate set does not invoke the model.

The current prompt contract is versioned in `backend/src/modules/ai/prompts.py` (`v1`). The model may return only catalog tool IDs, supported match reasons, supported tradeoffs, and known feature slugs. Match scores, pricing, names, and other authoritative values remain application/database fields.

## 3. Recommendation response
Each result contains:
- `tool_id`, `slug`, `name`, `tagline`
- `match_score` and `match_score_method` (platform-generated, see below)
- `match_reasons` and `tradeoffs` (grounded in catalog features/pricing)
- `relevant_feature_slugs`
- `pricing` copied from catalog plans
- `website_url`, `is_verified`, `last_verified_at`

The response envelope also reports `personalized` (whether the model produced the ranking or the deterministic fallback did), an optional `notice`, `prompt_version`, and `latency_ms`.

### Match score
`match_score` is a **relative fit score within the current result set**, not an absolute benchmark. The backend assigns it deterministically after validation (`rank_relative_v1`): the first item scores `100`, the last scores `55`, intermediate items are evenly spaced to one decimal place. A single-item result scores `100`. Ranking order comes from the model when output is valid, otherwise from catalog search relevance. The UI must label scores as relative and must never compare scores across separate queries.

## 3.1 Feedback
`POST /recommendations/feedback` stores a 1–5 accuracy rating (plus optional query and comment) in `recommendation_feedback`. Feedback is only accepted for tools that exist and are published; query text is normalized through the same sanitizer as the prompt input. Feedback is operational telemetry and does not alter stored intelligence scores.

## 3.2 Rate limiting
`POST /recommendations` is limited to **5 requests per minute per client IP** (SlowAPI shared limiter). Exceeding the limit returns HTTP `429` with the standard error envelope (`code: RATE_LIMITED`) and a `Retry-After: 60` header. The feedback endpoint is not rate limited.

## 4. Guardrails
- The model cannot invent catalog entries.
- The model cannot invent prices, features, ratings or benchmark results.
- Do not present model confidence as a measured product benchmark.
- Explain when catalog information is missing or stale.
- Keep provider API keys server-side.
- Apply per-user/IP rate limits and usage limits.
- Do not send unnecessary personal data to the model.
- Log model, prompt version, latency and token usage without logging secrets.

## 5. Scoring and ranking
Keep these concepts separate:
- Match score: how well a tool fits a user's stated requirements (`rank_relative_v1`, relative to the current result set).
- Intelligence score: platform evaluation based on documented dimensions (0–100, stored in `score_history`).
- Popularity: actual observed platform activity or credible external data.
- Sponsored placement: paid promotion, always labelled.

Never combine paid placement with organic score invisibly.

## 6. Prompt management
Version prompts in source control. Add test cases for hallucination, missing data, conflicting constraints, empty candidate sets and prompt injection in tool descriptions.
Treat request text and catalog descriptions as untrusted data; normalize request length and control characters, then instruct the model to ignore embedded instructions.

## 7. Fallback
If OpenRouter is unavailable, returns malformed output, or references unknown tool IDs/feature slugs, the service returns conventional catalog search results with `personalized: false` and a notice explaining that personalized recommendations are temporarily unavailable. An empty candidate set never invokes the model.

## 8. Provider configuration
- Primary: OpenRouter (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_TIMEOUT_SECONDS`, `OPENROUTER_MAX_RETRIES`).
- Optional: Groq (`GROQ_API_KEY`, `GROQ_MODEL`) through an adapter that imports the `groq` SDK lazily. If the SDK or key is missing, `get_client()` falls back to OpenRouter.
- Provider calls use JSON-object response mode; requests include the site URL and app title for OpenRouter attribution.
- Transient statuses (`408`, `429`, `5xx`) are retried up to `OPENROUTER_MAX_RETRIES`; a process-local circuit breaker skips the provider for a cooldown after repeated failures.
- Keys stay server-side; logs record model, prompt version, latency, result count, and token usage but never request content or credentials.
