from typing import Dict, List, Optional, Sequence
import uuid
import math

from sqlalchemy.ext.asyncio import AsyncSession

from src.common.exceptions import NotFoundError
from src.modules.catalog.models import ToolModel
from src.modules.catalog.service import CatalogService
from src.modules.intelligence.repository import IntelligenceRepository
from src.modules.intelligence.schemas import (
    AlternativeItem,
    AlternativesResponse,
    ComparisonFeatureRow,
    ComparisonMatrix,
    ComparisonToolSummary,
    RankingItem,
    RankingResponse,
)


class IntelligenceService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.catalog = CatalogService(session)
        self.repo = IntelligenceRepository(session)

    async def preview_comparison(self, tool_slugs: Sequence[str]) -> ComparisonMatrix:
        tools = [await self.catalog.get_published_tool(slug) for slug in tool_slugs]
        return self._build_matrix(tools, title="Tool comparison")

    async def get_comparison(self, slug: str) -> ComparisonMatrix:
        comparison = await self.repo.get_published_comparison(slug)
        if comparison is None:
            raise NotFoundError(f"Comparison '{slug}' not found")

        associations = sorted(comparison.tool_associations, key=lambda row: row.position)
        tools = [row.tool for row in associations]
        if (
            not 2 <= len(tools) <= 4
            or any(tool.platform_status != "published" for tool in tools)
        ):
            raise NotFoundError(f"Comparison '{slug}' not found")
        return self._build_matrix(
            tools,
            slug=comparison.slug,
            title=comparison.title,
            summary=comparison.summary,
        )

    async def get_alternatives(self, slug: str, limit: int = 10) -> AlternativesResponse:
        tool = await self.catalog.get_published_tool(slug)
        curated_rows = await self.repo.get_curated_alternatives(tool.id, limit)
        curated: List[AlternativeItem] = []
        curated_ids = []
        for relation, alternative in curated_rows:
            curated_ids.append(alternative.id)
            curated.append(
                AlternativeItem(
                    tool=ComparisonToolSummary.model_validate(alternative),
                    rationale=relation.rationale,
                    source="curated",
                )
            )

        remaining = max(0, limit - len(curated))
        related_rows = await self.repo.get_related_tools(
            tool_id=tool.id,
            category_ids=[association.category_id for association in tool.categories],
            tag_ids=[association.tag_id for association in tool.tags],
            exclude_ids=curated_ids,
            limit=remaining,
        )
        related = [
            AlternativeItem(
                tool=ComparisonToolSummary.model_validate(alternative),
                rationale=self._related_rationale(
                    tool.name, shared_categories, shared_tags
                ),
                source="related",
                shared_categories=shared_categories,
                shared_tags=shared_tags,
            )
            for alternative, shared_categories, shared_tags in related_rows
        ]
        return AlternativesResponse(
            tool=ComparisonToolSummary.model_validate(tool),
            alternatives=[*curated, *related],
        )

    async def get_rankings(
        self,
        taxonomy_slug: str,
        taxonomy_type: str = "category",
        pricing_filter: str = "all",
        page: int = 1,
        page_size: int = 25,
    ) -> RankingResponse:
        if taxonomy_type == "tag":
            taxonomy = await self.catalog.get_tag(taxonomy_slug)
            taxonomy_description = None
        else:
            taxonomy = await self.catalog.get_category(taxonomy_slug)
            if not taxonomy.is_active:
                raise NotFoundError(f"Category '{taxonomy_slug}' not found")
            taxonomy_description = taxonomy.description or taxonomy.seo_description

        skip = (page - 1) * page_size
        rows, total = await self.repo.list_taxonomy_rankings(
            taxonomy_type=taxonomy_type,
            taxonomy_id=taxonomy.id,
            pricing_filter=pricing_filter,
            skip=skip,
            limit=page_size,
        )
        items = [
            RankingItem(
                rank=int(rank),
                tool=ComparisonToolSummary.model_validate(tool),
                score_version=score.score_version,
                overall_score=float(score.overall_score),
                dimension_scores=score.dimension_scores,
                methodology_url=score.methodology_url,
                evidence=score.evidence,
                calculated_at=score.calculated_at,
            )
            for tool, score, rank in rows
        ]
        return RankingResponse(
            taxonomy_type=taxonomy_type,
            taxonomy_name=taxonomy.name,
            taxonomy_slug=taxonomy.slug,
            taxonomy_description=taxonomy_description,
            pricing_filter=pricing_filter,
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=math.ceil(total / page_size) if total else 1,
        )

    def _build_matrix(
        self,
        tools: Sequence[ToolModel],
        *,
        slug: Optional[str] = None,
        title: str,
        summary: Optional[str] = None,
    ) -> ComparisonMatrix:
        summaries = [ComparisonToolSummary.model_validate(tool) for tool in tools]
        support: Dict[uuid.UUID, Dict[str, object]] = {}
        feature_details: Dict[uuid.UUID, object] = {}

        for tool in tools:
            for association in tool.features:
                feature = association.feature
                if feature is None:
                    continue
                feature_details[feature.id] = feature
                level = association.support_level
                support.setdefault(feature.id, {})[tool.slug] = (
                    level if level in {"yes", "partial", "no", "unknown"} else "unknown"
                )

        tool_slugs = [tool.slug for tool in tools]
        feature_rows = [
            ComparisonFeatureRow(
                feature_id=feature.id,
                name=feature.name,
                slug=feature.slug,
                feature_group=feature.feature_group,
                support_by_tool={
                    tool_slug: support.get(feature.id, {}).get(tool_slug, "unknown")
                    for tool_slug in tool_slugs
                },
            )
            for feature in sorted(
                feature_details.values(),
                key=lambda item: (item.feature_group or "", item.name.casefold()),
            )
        ]
        return ComparisonMatrix(
            slug=slug,
            title=title,
            summary=summary,
            tools=summaries,
            features=feature_rows,
            pricing_by_tool={
                tool.slug: tool.pricing_plans for tool in tools
            },
        )

    @staticmethod
    def _related_rationale(
        target_name: str, shared_categories: int, shared_tags: int
    ) -> str:
        reasons = []
        if shared_categories:
            reasons.append(
                f"shares {shared_categories} categor{'y' if shared_categories == 1 else 'ies'}"
            )
        if shared_tags:
            reasons.append(f"shares {shared_tags} tag{'s' if shared_tags != 1 else ''}")
        return f"Related to {target_name} because it {' and '.join(reasons)}."
