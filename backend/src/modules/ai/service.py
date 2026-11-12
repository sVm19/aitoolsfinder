"""Catalog-grounded recommendation orchestration and verification."""

import logging
from dataclasses import dataclass, replace
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.catalog.models import FeatureModel, PricingPlanModel, ToolModel
from src.modules.ai.client import OpenRouterError, OpenRouterUnavailable, get_client
from src.modules.ai.prompts import (
    RecommendationChoice,
    build_recommendation_messages,
    parse_recommendation_output,
    sanitize_user_query,
)
from src.modules.ai.repository import AIRecommendationRepository, MAX_CANDIDATES
from src.modules.ai.schemas import MATCH_SCORE_METHOD


logger = logging.getLogger(__name__)


class UngroundedRecommendationError(ValueError):
    """The model returned a tool or feature absent from retrieved candidates."""


@dataclass(frozen=True)
class RecommendationResult:
    tool: ToolModel
    match_reasons: List[str]
    tradeoffs: List[str]
    relevant_features: List[FeatureModel]
    pricing_plans: List[PricingPlanModel]
    match_score: float = 0.0
    match_score_method: str = MATCH_SCORE_METHOD


@dataclass(frozen=True)
class RecommendationOutcome:
    items: List[RecommendationResult]
    personalized: bool
    notice: Optional[str] = None


class AIRecommendationService:
    def __init__(
        self, session: AsyncSession, *, client_factory=None
    ) -> None:
        self.repository = AIRecommendationRepository(session)
        self.client_factory = client_factory or get_client

    async def recommend(
        self,
        query: str,
        *,
        category_slugs: Optional[List[str]] = None,
        tag_slugs: Optional[List[str]] = None,
        pricing_model: Optional[str] = None,
        limit: int = MAX_CANDIDATES,
    ) -> RecommendationOutcome:
        normalized_query = sanitize_user_query(query)
        if not normalized_query:
            raise ValueError("A non-empty search request is required.")

        candidates = await self.repository.search_candidates(
            normalized_query,
            category_slugs=category_slugs,
            tag_slugs=tag_slugs,
            pricing_model=pricing_model,
            limit=limit,
        )
        if not candidates:
            return RecommendationOutcome(items=[], personalized=False)

        candidate_by_id = {str(tool.id): tool for tool in candidates}
        bound_candidates = [_bind_candidate(tool) for tool in candidates]
        messages = build_recommendation_messages(normalized_query, bound_candidates)
        try:
            client = self.client_factory()
            completion = await client.complete(messages)
            parsed = parse_recommendation_output(completion.content)
            items = _verify_and_hydrate(parsed.recommendations, candidate_by_id)
            return RecommendationOutcome(
                items=_apply_match_scores(items), personalized=True
            )
        except OpenRouterUnavailable:
            logger.info("Serving catalog search results because OpenRouter is unavailable")
            return self._fallback(candidates)
        except OpenRouterError:
            logger.warning("Serving catalog results after an OpenRouter request error")
            return self._fallback(candidates)
        except UngroundedRecommendationError:
            logger.warning("Discarding ungrounded OpenRouter recommendation response")
            return self._fallback(candidates)
        except ValueError:
            logger.warning("Serving catalog results after invalid OpenRouter output")
            return self._fallback(candidates)

    @staticmethod
    def _fallback(candidates: List[ToolModel]) -> RecommendationOutcome:
        items = [
            RecommendationResult(
                tool=tool,
                match_reasons=["Matched the published catalog search."],
                tradeoffs=[],
                relevant_features=[],
                pricing_plans=list(tool.pricing_plans or []),
            )
            for tool in candidates
        ]
        return RecommendationOutcome(
            items=_apply_match_scores(items),
            personalized=False,
            notice="Personalized ranking is temporarily unavailable; results use catalog search relevance.",
        )


def _apply_match_scores(items: List[RecommendationResult]) -> List[RecommendationResult]:
    """Assign a relative, rank-based score; never claim measured benchmark accuracy."""
    total = len(items)
    if total == 0:
        return []
    if total == 1:
        return [replace(items[0], match_score=100.0)]
    return [
        replace(
            item,
            match_score=round(100.0 - 45.0 * index / (total - 1), 1),
            match_score_method=MATCH_SCORE_METHOD,
        )
        for index, item in enumerate(items)
    ]


def _bind_candidate(tool: ToolModel) -> dict:
    """Expose only bounded, relevant public catalog fields to the model."""
    features = sorted(
        tool.features or [], key=lambda row: row.feature.name.casefold()
    )[:20]
    plans = sorted(
        tool.pricing_plans or [], key=lambda plan: (not plan.is_free, plan.name.casefold())
    )[:5]
    tags = sorted(
        (association.tag for association in tool.tags or []),
        key=lambda tag: tag.name.casefold(),
    )[:15]
    return {
        "tool_id": str(tool.id),
        "name": tool.name[:255],
        "tagline": (tool.tagline or "")[:300],
        "description": (tool.description or "")[:1200],
        "category": tool.primary_category.name if tool.primary_category else None,
        "tags": [tag.name[:100] for tag in tags],
        "platform_status": tool.platform_status,
        "is_verified": tool.is_verified,
        "last_verified_at": (
            tool.last_verified_at.isoformat() if tool.last_verified_at else None
        ),
        "features": [
            {
                "slug": row.feature.slug,
                "name": row.feature.name[:255],
                "support_level": row.support_level,
                "notes": (row.notes or "")[:300],
            }
            for row in features
        ],
        "pricing_plans": [
            {
                "name": plan.name[:255],
                "description": (plan.description or "")[:300],
                "amount_minor": plan.amount_minor,
                "currency": plan.currency,
                "billing_interval": plan.billing_interval,
                "is_free": plan.is_free,
                "limitations": _bounded_limitations(plan.limitations),
            }
            for plan in plans
        ],
    }


def _bounded_limitations(limitations: dict) -> dict:
    return {
        str(key)[:80]: str(value)[:200]
        for key, value in list((limitations or {}).items())[:10]
    }


def _verify_and_hydrate(
    choices: List[RecommendationChoice], candidates: dict[str, ToolModel]
) -> List[RecommendationResult]:
    results: List[RecommendationResult] = []
    seen_ids: set[str] = set()
    for choice in choices:
        tool = candidates.get(choice.tool_id)
        if tool is None:
            raise UngroundedRecommendationError("Model selected an unknown tool ID.")
        if choice.tool_id in seen_ids:
            raise UngroundedRecommendationError("Model returned a duplicate tool ID.")
        seen_ids.add(choice.tool_id)
        features_by_slug = {row.feature.slug: row.feature for row in tool.features or []}
        if any(slug not in features_by_slug for slug in choice.relevant_feature_slugs):
            raise UngroundedRecommendationError("Model selected an unknown feature.")
        results.append(
            RecommendationResult(
                tool=tool,
                match_reasons=choice.match_reasons,
                tradeoffs=choice.tradeoffs,
                relevant_features=[
                    features_by_slug[slug] for slug in choice.relevant_feature_slugs
                ],
                pricing_plans=list(tool.pricing_plans or []),
            )
        )
    return results
