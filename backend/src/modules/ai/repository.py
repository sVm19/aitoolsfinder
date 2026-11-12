"""Catalog-only retrieval and bounded hydration for AI recommendations."""

from typing import List, Optional, Sequence
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.catalog.models import (
    ToolFeatureModel,
    ToolModel,
    ToolTagModel,
)
from src.modules.catalog.repository import CatalogRepository
from src.modules.ai.models import RecommendationFeedbackModel


MAX_CANDIDATES = 15


class AIRecommendationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.catalog = CatalogRepository(session)

    async def search_candidates(
        self,
        query: str,
        *,
        category_slugs: Optional[List[str]] = None,
        tag_slugs: Optional[List[str]] = None,
        pricing_model: Optional[str] = None,
        limit: int = MAX_CANDIDATES,
    ) -> list[ToolModel]:
        candidate_limit = max(1, min(limit, MAX_CANDIDATES))
        matches, _ = await self.catalog.list_tools(
            status="published",
            category_slugs=category_slugs,
            tag_slugs=tag_slugs,
            pricing_model=pricing_model,
            query=query,
            sort="relevance",
            limit=candidate_limit,
        )
        if not matches:
            return []

        candidate_ids: Sequence[uuid.UUID] = [tool.id for tool in matches]
        statement = (
            select(ToolModel)
            .where(ToolModel.id.in_(candidate_ids), ToolModel.platform_status == "published")
            .options(
                selectinload(ToolModel.primary_category),
                selectinload(ToolModel.features).selectinload(ToolFeatureModel.feature),
                selectinload(ToolModel.pricing_plans),
                selectinload(ToolModel.tags)
                .selectinload(ToolTagModel.tag),
            )
        )
        hydrated = (await self.session.execute(statement)).scalars().all()
        by_id = {tool.id: tool for tool in hydrated}
        return [by_id[tool.id] for tool in matches if tool.id in by_id]

    async def get_published_tool(self, tool_id: uuid.UUID) -> Optional[ToolModel]:
        statement = select(ToolModel).where(
            ToolModel.id == tool_id,
            ToolModel.platform_status == "published",
        )
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def record_feedback(
        self,
        *,
        tool_id: uuid.UUID,
        rating: int,
        query: Optional[str] = None,
        comment: Optional[str] = None,
    ) -> RecommendationFeedbackModel:
        feedback = RecommendationFeedbackModel(
            tool_id=tool_id,
            rating=rating,
            query=query,
            comment=comment,
        )
        self.session.add(feedback)
        await self.session.flush()
        return feedback
