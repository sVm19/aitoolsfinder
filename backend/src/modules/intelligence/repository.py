from typing import List, Optional, Sequence, Tuple
import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.catalog.models import (
    ToolCategoryModel,
    ToolFeatureModel,
    ToolModel,
    ToolTagModel,
)
from src.modules.intelligence.models import (
    ComparisonModel,
    ComparisonToolModel,
    ScoreHistoryModel,
    ToolAlternativeModel,
)


def tool_detail_options():
    return (
        selectinload(ToolModel.primary_category),
        selectinload(ToolModel.categories).selectinload(ToolCategoryModel.category),
        selectinload(ToolModel.tags).selectinload(ToolTagModel.tag),
        selectinload(ToolModel.pricing_plans),
        selectinload(ToolModel.features).selectinload(ToolFeatureModel.feature),
    )


class IntelligenceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_published_comparison(
        self, slug: str
    ) -> Optional[ComparisonModel]:
        stmt = (
            select(ComparisonModel)
            .where(ComparisonModel.slug == slug, ComparisonModel.status == "published")
            .options(
                selectinload(ComparisonModel.tool_associations)
                .selectinload(ComparisonToolModel.tool)
                .selectinload(ToolModel.primary_category),
                selectinload(ComparisonModel.tool_associations)
                .selectinload(ComparisonToolModel.tool)
                .selectinload(ToolModel.pricing_plans),
                selectinload(ComparisonModel.tool_associations)
                .selectinload(ComparisonToolModel.tool)
                .selectinload(ToolModel.features)
                .selectinload(ToolFeatureModel.feature),
            )
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_curated_alternatives(
        self, tool_id: uuid.UUID, limit: int
    ) -> List[Tuple[ToolAlternativeModel, ToolModel]]:
        stmt = (
            select(ToolAlternativeModel, ToolModel)
            .join(
                ToolModel,
                ToolModel.id == ToolAlternativeModel.alternative_tool_id,
            )
            .where(
                ToolAlternativeModel.tool_id == tool_id,
                ToolModel.platform_status == "published",
            )
            .options(selectinload(ToolModel.primary_category))
            .order_by(ToolModel.name.asc())
            .limit(limit)
        )
        return list((await self.session.execute(stmt)).all())

    async def get_related_tools(
        self,
        tool_id: uuid.UUID,
        category_ids: Sequence[uuid.UUID],
        tag_ids: Sequence[uuid.UUID],
        exclude_ids: Sequence[uuid.UUID],
        limit: int,
    ) -> List[Tuple[ToolModel, int, int]]:
        category_counts = (
            select(
                ToolCategoryModel.tool_id.label("tool_id"),
                func.count().label("shared_categories"),
            )
            .where(ToolCategoryModel.category_id.in_(category_ids))
            .group_by(ToolCategoryModel.tool_id)
            .subquery()
        ) if category_ids else None
        tag_counts = (
            select(
                ToolTagModel.tool_id.label("tool_id"),
                func.count().label("shared_tags"),
            )
            .where(ToolTagModel.tag_id.in_(tag_ids))
            .group_by(ToolTagModel.tool_id)
            .subquery()
        ) if tag_ids else None

        if category_counts is None and tag_counts is None:
            return []

        shared_categories = (
            func.coalesce(category_counts.c.shared_categories, 0)
            if category_counts is not None
            else 0
        )
        shared_tags = (
            func.coalesce(tag_counts.c.shared_tags, 0) if tag_counts is not None else 0
        )
        stmt = select(ToolModel, shared_categories, shared_tags)
        conditions = [ToolModel.platform_status == "published", ToolModel.id != tool_id]
        if category_counts is not None:
            stmt = stmt.outerjoin(category_counts, category_counts.c.tool_id == ToolModel.id)
        if tag_counts is not None:
            stmt = stmt.outerjoin(tag_counts, tag_counts.c.tool_id == ToolModel.id)
        if exclude_ids:
            conditions.append(ToolModel.id.not_in(exclude_ids))
        stmt = (
            stmt.where(or_(shared_categories > 0, shared_tags > 0), *conditions)
            .options(*tool_detail_options())
            .order_by((shared_categories + shared_tags).desc(), ToolModel.name.asc())
            .limit(limit)
        )
        rows = (await self.session.execute(stmt)).all()
        return [(tool, int(categories), int(tags)) for tool, categories, tags in rows]

    async def list_taxonomy_rankings(
        self,
        taxonomy_type: str,
        taxonomy_id: uuid.UUID,
        pricing_filter: str,
        skip: int,
        limit: int,
    ) -> Tuple[List[Tuple[ToolModel, ScoreHistoryModel, int]], int]:
        latest_score_rows = (
            select(
                ScoreHistoryModel.id.label("score_id"),
                func.row_number()
                .over(
                    partition_by=ScoreHistoryModel.tool_id,
                    order_by=(
                        ScoreHistoryModel.calculated_at.desc(),
                        ScoreHistoryModel.id.desc(),
                    ),
                )
                .label("score_number"),
            )
            .subquery()
        )
        if taxonomy_type == "tag":
            taxonomy_association = (
                select(ToolTagModel.tool_id)
                .where(
                    ToolTagModel.tool_id == ToolModel.id,
                    ToolTagModel.tag_id == taxonomy_id,
                )
                .exists()
            )
            taxonomy_condition = taxonomy_association
        else:
            category_association = (
                select(ToolCategoryModel.tool_id)
                .where(
                    ToolCategoryModel.tool_id == ToolModel.id,
                    ToolCategoryModel.category_id == taxonomy_id,
                )
                .exists()
            )
            taxonomy_condition = or_(
                ToolModel.primary_category_id == taxonomy_id,
                category_association,
            )
        conditions = [
            ToolModel.platform_status == "published",
            taxonomy_condition,
        ]
        if pricing_filter == "free":
            conditions.append(ToolModel.pricing_model.in_(("free", "freemium")))
        elif pricing_filter == "paid":
            conditions.append(
                ToolModel.pricing_model.in_(("paid", "usage_based", "contact_sales"))
            )

        count_stmt = (
            select(func.count(func.distinct(ToolModel.id)))
            .join(ScoreHistoryModel, ToolModel.id == ScoreHistoryModel.tool_id)
            .join(latest_score_rows, latest_score_rows.c.score_id == ScoreHistoryModel.id)
            .where(*conditions, latest_score_rows.c.score_number == 1)
        )
        total = (await self.session.execute(count_stmt)).scalar_one()

        score_rank = func.row_number().over(
            partition_by=ToolModel.is_sponsored,
            order_by=(
                ScoreHistoryModel.overall_score.desc(),
                ScoreHistoryModel.calculated_at.desc(),
                ToolModel.name.asc(),
                ToolModel.id.asc(),
            ),
        ).label("rank")
        stmt = (
            select(ToolModel, ScoreHistoryModel, score_rank)
            .join(ScoreHistoryModel, ToolModel.id == ScoreHistoryModel.tool_id)
            .join(
                latest_score_rows,
                latest_score_rows.c.score_id == ScoreHistoryModel.id,
            )
            .where(*conditions, latest_score_rows.c.score_number == 1)
            .options(selectinload(ToolModel.primary_category))
            .order_by(
                ScoreHistoryModel.overall_score.desc(),
                ScoreHistoryModel.calculated_at.desc(),
                ToolModel.name.asc(),
                ToolModel.id.asc(),
            )
            .offset(skip)
            .limit(limit)
        )
        rows = (await self.session.execute(stmt)).all()
        return rows, total
