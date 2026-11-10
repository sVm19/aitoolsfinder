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

## 3. Recommendation response
Each result should contain:
- tool_id
- match_score (platform-generated, documented scale)
- match_reasons
- relevant_features
- tradeoffs
- pricing summary from catalog data
- evidence/last verified information

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
- Match score: how well a tool fits a user's stated requirements.
- Intelligence score: platform evaluation based on documented dimensions.
- Popularity: actual observed platform activity or credible external data.
- Sponsored placement: paid promotion, always labelled.

Never combine paid placement with organic score invisibly.

## 6. Prompt management
Version prompts in source control. Add test cases for hallucination, missing data, conflicting constraints, empty candidate sets and prompt injection in tool descriptions.

## 7. Fallback
If OpenRouter is unavailable, return conventional catalog search results and explain that personalized recommendations are temporarily unavailable.
