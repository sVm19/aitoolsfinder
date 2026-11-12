# Implementation Plan — Phase 5: AI Recommendations Engine

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Provider:** OpenRouter (`anthropic/claude-3.5-sonnet` / configurable)  
**Status:** Completed & Verified (Depends on Phase 3 & 4)
**Exit Criteria:** Users receive catalog-grounded, explainable tool recommendations from natural language queries; zero hallucination verified.

---

## 1. Objectives & Scope

Phase 5 builds the **AI Tool Finder** powered by OpenRouter. Rather than acting as an unconstrained chatbot, the AI engine uses a **two-stage grounded retrieval pipeline**: it searches the internal Supabase catalog for verified candidates, prompts the LLM with strictly bounded tool data, and validates returned IDs against the database before rendering.

### In Scope
1. **OpenRouter Adapter (`backend/src/modules/ai/`):**
   - Resilient HTTP client with 10s timeouts, exponential backoff, and retry limits.
   - Server-side API key isolation (`OPENROUTER_API_KEY`).
   - Token usage and latency logging with request correlation IDs.
2. **Two-Stage Grounded Retrieval Pipeline:**
   - **Stage 1 (Catalog Retrieval):** Semantic/keyword query against Supabase FTS to select 5–15 published tool candidates.
   - **Stage 2 (LLM Ranking & Explanation):** OpenRouter evaluates the bounded candidate list against the user's constraints (budget, category, platform).
   - **Stage 3 (Verification Gate):** FastAPI ensures all returned `tool_id`s exist in the catalog and injects authoritative pricing from Supabase.
3. **Guardrails & Anti-Hallucination:**
   - Model cannot invent tool names, prices, feature capabilities, or ratings.
   - If no candidates match, return a factual empty state instead of guessing.
   - Prompt injection sanitization on user input.
4. **Interactive UI (`frontend/src/app/(public)/ai-finder/`):**
   - Natural language search box with guided preference chips (Budget: Free / Under $30, Experience Level, Primary Job).
   - Recommendation results cards displaying:
     - Match Score (% fit)
     - Key Why It Fits bullets
     - Explicit Tradeoffs & Limitations
     - Authoritative Pricing Tier
5. **Fallback Resilience:**
   - If OpenRouter API fails or rate limits trigger, seamlessly fall back to deterministic database FTS search with a user notice.

---

## 2. Step-by-Step Task Checklist

### Progress

- **Subphase 1 of 6 — OpenRouter adapter:** Added the configurable async client, JSON-mode payload builder and response parser, OpenRouter identification headers, 10-second default timeout, two bounded exponential retries for transient failures, and a process-local circuit breaker. Logs include model, latency, and token counts without request content or credentials. Ruff and Python compilation pass. Provider integration is not called against a live key; adapter behavior will receive mocked coverage in Subphase 6.
- **Subphase 2 of 6 — Prompt contract:** Added prompt version v1 with a strict candidate-only JSON contract, untrusted-input/candidate boundaries, query control-character and length normalization, and Pydantic output validation that rejects extra fields and oversized lists. Ruff and Python compilation pass; prompt regression coverage remains in Subphase 6.
- **Subphase 3 of 6 — Grounded service:** Added Supabase/SQLite catalog search for up to 15 published candidates, bounded candidate binding for product/features/pricing, OpenRouter orchestration, ID and feature-slug validation, and deterministic catalog-result fallback for provider or malformed-output failures. Ruff, Python compilation, and ORM mapper configuration pass; behavioral cases are reserved for Subphase 6.
- **Subphase 4 of 6 — API endpoints and rate limiting:** `POST /api/v1/recommendations` and `POST /api/v1/recommendations/feedback` implemented with typed Pydantic responses. Recommendations are limited to 5 requests/minute/IP through a shared SlowAPI limiter; the custom 429 handler returns the standard error envelope with `code: RATE_LIMITED` and `Retry-After: 60`. Feedback is validated against the published catalog (404 otherwise), sanitized, and persisted.
- **Subphase 5 of 6 — AI Finder UI:** `/ai-finder` server page loads categories and renders a client view with prompt intake (1000-char cap), pricing/category filters, example prompts, idle/loading/error/success states, relative-score cards with reasons/tradeoffs/pricing, top-two compare shortcut, compare-tray toggle, and accuracy feedback. Navbar, footer, and homepage links point to `/ai-finder`.
- **Subphase 6 of 6 — Verification:** 22 AI/guardrail tests pass, including mocked OpenRouter success/timeout/retry/circuit paths, hallucinated ID and feature-slug fallback, prompt-injection sanitization, schema validation, rate-limit 429, and feedback persistence. Full backend suite: 33 passed. Frontend `tsc --noEmit` and `next build` pass.

- [x] **Task 5.1: OpenRouter Client Adapter (`backend/src/modules/ai/client.py`)**
  - [x] Implement async HTTP client with custom identification headers.
  - [x] Add structured request payload builder and response parser.
  - [x] Retry transient failures within configured bounds and signal fallback after circuit breaker trips.

- [x] **Task 5.2: Recommendation Prompt Engineering (`backend/src/modules/ai/prompts.py`)**
  - [x] Construct versioned system prompt with strict JSON output schema.
  - [x] Enforce candidate-only selection and grounded reasons/tradeoffs; treat query and catalog fields as untrusted data.

- [x] **Task 5.3: Backend Recommendations Service (`backend/src/modules/ai/service.py`)**
  - [x] Implement published catalog candidate retrieval using Supabase full-text search.
  - [x] Implement bounded candidate data binding (names, features, pricing, limitations).
  - [x] Implement post-generation validation for candidate IDs and feature slugs.
  - [x] Assign deterministic relative match scores (`rank_relative_v1`).

- [x] **Task 5.4: API Endpoints (`backend/src/modules/ai/router.py`)**
  - `POST /api/v1/recommendations`: Submit user query and constraints.
  - `POST /api/v1/recommendations/feedback`: Collect thumbs up/down accuracy feedback.
  - Add rate limiting: 5 requests per minute per IP for anonymous users.

- [x] **Task 5.5: AI Finder Frontend Interface (`frontend/src/app/(public)/ai-finder/page.tsx`)**
  - Conversational input with example prompts ("Best AI tool for podcast transcripts", "AI coder under $20/mo").
  - Animated results cards highlighting `Tradeoffs` with sunrise orange accent badges.
  - "Direct Comparison" shortcut comparing the top 2 recommendations.

- [x] **Task 5.6: Test Suite & Guardrail Verification**
  - Mocked OpenRouter tests simulating successful recommendations, hallucinated ID rejection, and timeout fallbacks.
  - Prompt injection regression test suite.

### Verification record
- `cd backend && python -m pytest -q` → **33 passed** (22 in `tests/test_ai_recommendations.py`).
- `cd frontend && npm run typecheck` → passed.
- `cd frontend && npm run build` → passed (16 routes generated; `/ai-finder` server-rendered).
- Migration `0006_recommendation_feedback` is the schema source of truth for feedback storage.
- Live OpenRouter calls are not exercised in CI; provider behavior is verified with `httpx.MockTransport`.

---

## 3. Milestone Exit Criteria

1. User prompt returns ranked tool candidates within 3 seconds.
2. 100% of recommended tools match actual published records in Supabase.
3. Every recommendation displays factual tradeoffs and verified pricing.
4. Fallback search works if OpenRouter API is intentionally unreachable.
