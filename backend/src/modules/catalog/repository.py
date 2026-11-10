import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.catalog.models import (
    CategoryModel,
    TagModel,
    ToolModel,
    ToolCategoryModel,
    ToolTagModel,
)


class CatalogRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # --------------------------------------------------------------------------
    # Categories
    # --------------------------------------------------------------------------
    async def get_category_by_id(
        self, category_id: uuid.UUID
    ) -> Optional[CategoryModel]:
        stmt = select(CategoryModel).where(CategoryModel.id == category_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_category_by_slug(self, slug: str) -> Optional[CategoryModel]:
        stmt = select(CategoryModel).where(CategoryModel.slug == slug)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_categories(
        self, only_active: bool = True, skip: int = 0, limit: int = 100
    ) -> Tuple[List[CategoryModel], int]:
        conditions = []
        if only_active:
            conditions.append(CategoryModel.is_active.is_(True))

        count_stmt = select(func.count(CategoryModel.id)).where(
            and_(*conditions) if conditions else True
        )
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = (
            select(CategoryModel)
            .where(and_(*conditions) if conditions else True)
            .order_by(CategoryModel.sort_order.asc(), CategoryModel.name.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def create_category(self, category: CategoryModel) -> CategoryModel:
        self.session.add(category)
        await self.session.flush()
        return category

    # --------------------------------------------------------------------------
    # Tags
    # --------------------------------------------------------------------------
    async def get_tag_by_id(self, tag_id: uuid.UUID) -> Optional[TagModel]:
        stmt = select(TagModel).where(TagModel.id == tag_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_tag_by_slug(self, slug: str) -> Optional[TagModel]:
        stmt = select(TagModel).where(TagModel.slug == slug)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_tags(
        self, skip: int = 0, limit: int = 100
    ) -> Tuple[List[TagModel], int]:
        count_stmt = select(func.count(TagModel.id))
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = select(TagModel).order_by(TagModel.name.asc()).offset(skip).limit(limit)
        items = (await self.session.execute(stmt)).scalars().all()
        return list(items), total

    async def create_tag(self, tag: TagModel) -> TagModel:
        self.session.add(tag)
        await self.session.flush()
        return tag

    # --------------------------------------------------------------------------
    # Tools
    # --------------------------------------------------------------------------
    async def get_tool_by_id(
        self, tool_id: uuid.UUID, load_relations: bool = False
    ) -> Optional[ToolModel]:
        stmt = select(ToolModel).where(ToolModel.id == tool_id)
        if load_relations:
            stmt = stmt.options(
                selectinload(ToolModel.primary_category),
                selectinload(ToolModel.categories).selectinload(
                    ToolCategoryModel.category
                ),
                selectinload(ToolModel.tags).selectinload(ToolTagModel.tag),
                selectinload(ToolModel.pricing_plans),
            )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_tool_by_slug(
        self, slug: str, load_relations: bool = True
    ) -> Optional[ToolModel]:
        stmt = select(ToolModel).where(ToolModel.slug == slug)
        if load_relations:
            stmt = stmt.options(
                selectinload(ToolModel.primary_category),
                selectinload(ToolModel.categories).selectinload(
                    ToolCategoryModel.category
                ),
                selectinload(ToolModel.tags).selectinload(ToolTagModel.tag),
                selectinload(ToolModel.pricing_plans),
            )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_tools(
        self,
        status: Optional[str] = "published",
        category_slugs: Optional[List[str]] = None,
        tag_slugs: Optional[List[str]] = None,
        pricing_model: Optional[str] = None,
        is_verified: Optional[bool] = None,
        query: Optional[str] = None,
        sort: str = "newest",
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[ToolModel], int]:
        conditions = []
        if status:
            conditions.append(ToolModel.platform_status == status)
        if category_slugs:
            conditions.append(
                ToolModel.id.in_(
                    select(ToolCategoryModel.tool_id)
                    .join(CategoryModel, CategoryModel.id == ToolCategoryModel.category_id)
                    .where(
                        CategoryModel.slug.in_(category_slugs),
                        CategoryModel.is_active.is_(True),
                    )
                )
            )
        if tag_slugs:
            conditions.append(
                ToolModel.id.in_(
                    select(ToolTagModel.tool_id)
                    .join(TagModel, TagModel.id == ToolTagModel.tag_id)
                    .where(TagModel.slug.in_(tag_slugs))
                )
            )
        if pricing_model:
            conditions.append(ToolModel.pricing_model == pricing_model)
        if is_verified is not None:
            conditions.append(ToolModel.is_verified.is_(is_verified))

        search_rank = None
        if query:
            if self.session.get_bind().dialect.name == "postgresql":
                ts_query = func.websearch_to_tsquery("english", query)
                conditions.append(
                    or_(
                        ToolModel.search_vector.op("@@")(ts_query),
                        ToolModel.name.op("%")(query),
                    )
                )
                search_rank = func.ts_rank_cd(ToolModel.search_vector, ts_query)
            else:
                pattern = f"%{query}%"
                conditions.append(
                    or_(
                        ToolModel.name.ilike(pattern),
                        ToolModel.tagline.ilike(pattern),
                        ToolModel.description.ilike(pattern),
                    )
                )

        where_clause = and_(*conditions) if conditions else True
        count_stmt = select(func.count(ToolModel.id)).where(where_clause)
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = select(ToolModel).where(where_clause)
        if sort == "relevance" and search_rank is not None:
            stmt = stmt.order_by(desc(search_rank), ToolModel.name.asc())
        elif sort == "alphabetical":
            stmt = stmt.order_by(ToolModel.name.asc(), ToolModel.id.asc())
        else:
            stmt = stmt.order_by(ToolModel.created_at.desc(), ToolModel.id.asc())
        stmt = stmt.offset(skip).limit(limit)
        items = (await self.session.execute(stmt)).scalars().all()
        return list(items), total

    async def autocomplete_tools(self, query: str, limit: int = 8) -> List[ToolModel]:
        stmt = select(ToolModel).where(ToolModel.platform_status == "published")
        if self.session.get_bind().dialect.name == "postgresql":
            trigram_match = ToolModel.name.op("%")(query)
            stmt = (
                stmt.where(
                    or_(
                        ToolModel.name.ilike(f"{query}%"),
                        trigram_match,
                    )
                )
                .order_by(desc(func.similarity(ToolModel.name, query)), ToolModel.name.asc())
            )
        else:
            stmt = stmt.where(ToolModel.name.ilike(f"%{query}%")).order_by(
                ToolModel.name.asc()
            )
        result = await self.session.execute(stmt.limit(limit))
        return list(result.scalars().all())

    async def create_tool(self, tool: ToolModel) -> ToolModel:
        self.session.add(tool)
        await self.session.flush()
        return tool

    async def delete_tool(self, tool: ToolModel) -> None:
        await self.session.delete(tool)
        await self.session.flush()
