# Implementation Plan — Phase 5: AI Recommendations Engine

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Provider:** OpenRouter (`anthropic/claude-3.5-sonnet` / configurable)  
**Status:** Queued (Depends on Phase 3 & 4)  
**Exit Criteria:** Users receive catalog-grounded, explainable tool recommendations from natural language queries; zero hallucination verified.

---

## 1. Objectives & Scope

Phase 5 builds the **AI Tool Finder** powered by OpenRouter. Rather than acting as an unconstrained chatbot, the AI engine uses a **two-stage grounded retrieval pipeline**: it searches the internal PostgreSQL catalog for verified candidates, prompts the LLM with strictly bounded tool data, and validates returned IDs against the database before rendering.

### In Scope
1. **OpenRouter Adapter (`backend/src/modules/ai/`):**
   - Resilient HTTP client with 10s timeouts, exponential backoff, and retry limits.
   - Server-side API key isolation (`OPENROUTER_API_KEY`).
   - Token usage and latency logging with request correlation IDs.
2. **Two-Stage Grounded Retrieval Pipeline:**
   - **Stage 1 (Catalog Retrieval):** Semantic/keyword query against PostgreSQL FTS to select 5–15 published tool candidates.
   - **Stage 2 (LLM Ranking & Explanation):** OpenRouter evaluates the bounded candidate list against the user's constraints (budget, category, platform).
   - **Stage 3 (Verification Gate):** FastAPI ensures all returned `tool_id`s exist in the catalog and injects authoritative pricing from PostgreSQL.
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

- [ ] **Task 5.1: OpenRouter Client Adapter (`backend/src/modules/ai/client.py`)**
  - Implement async HTTP client with custom headers (`HTTP-Referer: https://aitoolsfinder.cloud`, `X-Title: AIToolsFinder`).
  - Add structured request payload builder and response parser.
  - Implement circuit-breaker fallback on 5xx or timeout.

- [ ] **Task 5.2: Recommendation Prompt Engineering (`backend/src/modules/ai/prompts.py`)**
  - Construct versioned system prompt with strict JSON output schema.
  - Enforce constraint instructions: *"You must only select from the provided candidates list. Do not introduce external products. Highlight genuine tradeoffs."*

- [ ] **Task 5.3: Backend Recommendations Service (`backend/src/modules/ai/service.py`)**
  - Implement catalog candidate retrieval using PostgreSQL full-text search.
  - Implement candidate data binder (extracting names, features, pricing, limitations).
  - Implement post-generation validator rejecting ungrounded tool IDs.

- [ ] **Task 5.4: API Endpoints (`backend/src/modules/ai/router.py`)**
  - `POST /api/v1/recommendations`: Submit user query and constraints.
  - `POST /api/v1/recommendations/feedback`: Collect thumbs up/down accuracy feedback.
  - Add rate limiting: 5 requests per minute per IP for anonymous users.

- [ ] **Task 5.5: AI Finder Frontend Interface (`frontend/src/app/(public)/ai-finder/page.tsx`)**
  - Conversational input with example prompts ("Best AI tool for podcast transcripts", "AI coder under $20/mo").
  - Animated results cards highlighting `Tradeoffs` with sunrise orange accent badges.
  - "Direct Comparison" shortcut comparing the top 2 recommendations.

- [ ] **Task 5.6: Test Suite & Guardrail Verification**
  - Mocked OpenRouter tests simulating successful recommendations, hallucinated ID rejection, and timeout fallbacks.
  - Prompt injection regression test suite.

---

## 3. Milestone Exit Criteria

1. User prompt returns ranked tool candidates within 3 seconds.
2. 100% of recommended tools match actual published records in PostgreSQL.
3. Every recommendation displays factual tradeoffs and verified pricing.
4. Fallback search works if OpenRouter API is intentionally unreachable.
