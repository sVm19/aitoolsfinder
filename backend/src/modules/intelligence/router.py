from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.modules.intelligence.schemas import (
    AlternativesResponse,
    ComparisonMatrix,
    ComparisonPreviewRequest,
    RankingResponse,
)
from src.modules.intelligence.service import IntelligenceService


router = APIRouter(tags=["Intelligence"])


@router.post("/comparisons/preview", response_model=ComparisonMatrix)
async def preview_comparison(
    payload: ComparisonPreviewRequest,
    session: AsyncSession = Depends(get_db),
):
    return await IntelligenceService(session).preview_comparison(payload.tool_slugs)


@router.get("/comparisons/{slug}", response_model=ComparisonMatrix)
async def get_comparison(slug: str, session: AsyncSession = Depends(get_db)):
    return await IntelligenceService(session).get_comparison(slug)


@router.get("/tools/{slug}/alternatives", response_model=AlternativesResponse)
async def get_tool_alternatives(
    slug: str,
    limit: int = Query(default=10, ge=1, le=20),
    session: AsyncSession = Depends(get_db),
):
    return await IntelligenceService(session).get_alternatives(slug, limit)


@router.get("/rankings/{slug}", response_model=RankingResponse)
async def get_category_rankings(
    slug: str,
    taxonomy_type: str = Query(default="category", pattern="^(category|tag)$"),
    pricing_filter: str = Query(default="all", pattern="^(all|free|paid)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    return await IntelligenceService(session).get_rankings(
        taxonomy_slug=slug,
        taxonomy_type=taxonomy_type,
        pricing_filter=pricing_filter,
        page=page,
        page_size=page_size,
    )
