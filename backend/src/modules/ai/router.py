"""Grounded AI recommendation endpoints (Phase 5)."""

import logging
import time

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.common.exceptions import NotFoundError
from src.core.database import get_db
from src.core.ratelimit import limiter
from src.modules.ai.prompts import PROMPT_VERSION, sanitize_user_query
from src.modules.ai.repository import AIRecommendationRepository
from src.modules.ai.schemas import (
    FeedbackRequest,
    FeedbackResponse,
    PricingPlanSummary,
    RecommendationItem,
    RecommendationRequest,
    RecommendationResponse,
)
from src.modules.ai.service import AIRecommendationService, RecommendationResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["AI Recommendations"])


@router.post(
    "",
    response_model=RecommendationResponse,
    summary="Get catalog-grounded AI tool recommendations",
)
@limiter.limit("5/minute")
async def get_recommendations(
    request: Request,
    payload: RecommendationRequest,
    session: AsyncSession = Depends(get_db),
) -> RecommendationResponse:
    """Rank published catalog candidates for a natural-language request.

    The model receives only bounded candidate data. Unknown tool IDs or feature
    slugs cause a deterministic fallback to catalog search relevance.
    """
    started_at = time.perf_counter()

    service = AIRecommendationService(session)
    outcome = await service.recommend(
        query=payload.query,
        category_slugs=payload.category_slugs,
        tag_slugs=payload.tag_slugs,
        pricing_model=payload.pricing_model,
        limit=payload.limit,
    )

    latency_ms = int((time.perf_counter() - started_at) * 1000)
    logger.info(
        "Recommendations query_length=%s results=%s personalized=%s "
        "latency_ms=%s prompt_version=%s",
        len(payload.query),
        len(outcome.items),
        outcome.personalized,
        latency_ms,
        PROMPT_VERSION,
    )

    return RecommendationResponse(
        items=[_serialize_item(result) for result in outcome.items],
        personalized=outcome.personalized,
        notice=outcome.notice,
        prompt_version=PROMPT_VERSION,
        latency_ms=latency_ms,
    )


@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit accuracy feedback for a recommendation",
)
async def submit_feedback(
    payload: FeedbackRequest,
    session: AsyncSession = Depends(get_db),
) -> FeedbackResponse:
    """Store feedback for a tool that exists and is published in the catalog."""
    repository = AIRecommendationRepository(session)
    tool = await repository.get_published_tool(payload.tool_id)
    if tool is None:
        raise NotFoundError("Tool not found in the published catalog.")

    feedback = await repository.record_feedback(
        tool_id=tool.id,
        rating=payload.rating,
        query=sanitize_user_query(payload.query) if payload.query else None,
        comment=payload.comment.strip() if payload.comment else None,
    )

    return FeedbackResponse(
        id=str(feedback.id),
        tool_id=str(feedback.tool_id),
        rating=feedback.rating,
        created_at=feedback.created_at,
    )


def _serialize_item(result: RecommendationResult) -> RecommendationItem:
    tool = result.tool
    return RecommendationItem(
        tool_id=str(tool.id),
        slug=tool.slug,
        name=tool.name,
        tagline=tool.tagline,
        match_score=result.match_score,
        match_score_method=result.match_score_method,
        match_reasons=result.match_reasons,
        tradeoffs=result.tradeoffs,
        relevant_feature_slugs=[feature.slug for feature in result.relevant_features],
        pricing=[_serialize_plan(plan) for plan in result.pricing_plans],
        website_url=tool.website_url,
        is_verified=tool.is_verified,
        last_verified_at=tool.last_verified_at,
    )


def _serialize_plan(plan) -> PricingPlanSummary:
    return PricingPlanSummary(
        name=plan.name,
        amount_minor=plan.amount_minor,
        currency=plan.currency,
        billing_interval=plan.billing_interval or "unknown",
        is_free=plan.is_free,
        limitations={
            str(key)[:80]: str(value)[:200]
            for key, value in list((plan.limitations or {}).items())[:10]
        },
    )