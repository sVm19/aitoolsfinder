import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from src.common.exceptions import NotFoundError, ValidationError
from src.modules.catalog.models import (
    CategoryModel,
    TagModel,
    ToolModel,
    ToolCategoryModel,
    ToolTagModel,
    PricingPlanModel,
)
from src.modules.catalog.repository import CatalogRepository
from src.modules.catalog.schemas import (
    CategoryCreate,
    CategoryUpdate,
    TagCreate,
    ToolCreate,
    ToolUpdate,
    slugify,
)


class CatalogService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = CatalogRepository(session)

    # --------------------------------------------------------------------------
    # Categories
    # --------------------------------------------------------------------------
    async def get_category(self, slug_or_id: str) -> CategoryModel:
        category = None
        try:
            val_uuid = uuid.UUID(slug_or_id)
            category = await self.repo.get_category_by_id(val_uuid)
        except ValueError:
            category = await self.repo.get_category_by_slug(slug_or_id)

        if not category:
            raise NotFoundError(f"Category '{slug_or_id}' not found")
        return category

    async def list_categories(
        self, only_active: bool = True, skip: int = 0, limit: int = 100
    ) -> Tuple[List[CategoryModel], int]:
        return await self.repo.list_categories(
            only_active=only_active, skip=skip, limit=limit
        )

    async def create_category(self, payload: CategoryCreate) -> CategoryModel:
        slug = payload.slug or slugify(payload.name)
        existing = await self.repo.get_category_by_slug(slug)
        if existing:
            raise ValidationError(f"Category slug '{slug}' already exists")

        category = CategoryModel(
            name=payload.name,
            slug=slug,
            description=payload.description,
            parent_id=payload.parent_id,
            seo_title=payload.seo_title,
            seo_description=payload.seo_description,
            is_active=payload.is_active,
            sort_order=payload.sort_order,
        )
        return await self.repo.create_category(category)

    async def update_category(
        self, category_id: uuid.UUID, payload: CategoryUpdate
    ) -> CategoryModel:
        category = await self.repo.get_category_by_id(category_id)
        if not category:
            raise NotFoundError(f"Category '{category_id}' not found")

        update_data = payload.model_dump(exclude_unset=True)
        if "name" in update_data and "slug" not in update_data and not category.slug:
            update_data["slug"] = slugify(update_data["name"])

        if "slug" in update_data and update_data["slug"] != category.slug:
            existing = await self.repo.get_category_by_slug(update_data["slug"])
            if existing and existing.id != category.id:
                raise ValidationError(
                    f"Category slug '{update_data['slug']}' already exists"
                )

        for key, value in update_data.items():
            setattr(category, key, value)

        category.updated_at = datetime.now(timezone.utc)
        await self.session.flush()
        return category

    # --------------------------------------------------------------------------
    # Tags
    # --------------------------------------------------------------------------
    async def get_tag(self, slug_or_id: str) -> TagModel:
        tag = None
        try:
            val_uuid = uuid.UUID(slug_or_id)
            tag = await self.repo.get_tag_by_id(val_uuid)
        except ValueError:
            tag = await self.repo.get_tag_by_slug(slug_or_id)

        if not tag:
            raise NotFoundError(f"Tag '{slug_or_id}' not found")
        return tag

    async def list_tags(
        self, skip: int = 0, limit: int = 100
    ) -> Tuple[List[TagModel], int]:
        return await self.repo.list_tags(skip=skip, limit=limit)

    async def create_tag(self, payload: TagCreate) -> TagModel:
        slug = payload.slug or slugify(payload.name)
        existing = await self.repo.get_tag_by_slug(slug)
        if existing:
            raise ValidationError(f"Tag slug '{slug}' already exists")

        tag = TagModel(name=payload.name, slug=slug)
        return await self.repo.create_tag(tag)

    # --------------------------------------------------------------------------
    # Tools
    # --------------------------------------------------------------------------
    async def get_tool(self, slug_or_id: str) -> ToolModel:
        tool = None
        try:
            val_uuid = uuid.UUID(slug_or_id)
            tool = await self.repo.get_tool_by_id(val_uuid, load_relations=True)
        except ValueError:
            tool = await self.repo.get_tool_by_slug(slug_or_id, load_relations=True)

        if not tool:
            raise NotFoundError(f"Tool '{slug_or_id}' not found")
        return tool

    async def list_tools(
        self,
        status: Optional[str] = "published",
        category_slugs: Optional[List[str]] = None,
        tag_slugs: Optional[List[str]] = None,
        pricing_model: Optional[str] = None,
        is_verified: Optional[bool] = None,
        query: Optional[str] = None,
        sort: str = "newest",
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[ToolModel], int]:
        skip = (page - 1) * page_size
        return await self.repo.list_tools(
            status=status,
            category_slugs=category_slugs,
            tag_slugs=tag_slugs,
            pricing_model=pricing_model,
            is_verified=is_verified,
            query=query.strip() if query and query.strip() else None,
            sort=sort,
            skip=skip,
            limit=page_size,
        )

    async def autocomplete_tools(self, query: str, limit: int = 8) -> List[ToolModel]:
        normalized_query = query.strip()
        if len(normalized_query) < 2:
            return []
        return await self.repo.autocomplete_tools(normalized_query, limit=limit)

    async def create_tool(
        self, payload: ToolCreate, created_by: Optional[uuid.UUID] = None
    ) -> ToolModel:
        slug = payload.slug or slugify(payload.name)
        existing = await self.repo.get_tool_by_slug(slug)
        if existing:
            raise ValidationError(f"Tool with slug '{slug}' already exists")

        # Validate publication rules if creating directly in published state
        if payload.platform_status == "published":
            if not payload.primary_category_id and not payload.category_ids:
                raise ValidationError("Published tools require at least one category")

        tool = ToolModel(
            name=payload.name,
            slug=slug,
            tagline=payload.tagline,
            description=payload.description,
            website_url=payload.website_url,
            logo_object_key=payload.logo_object_key,
            primary_category_id=payload.primary_category_id,
            pricing_model=payload.pricing_model,
            platform_status=payload.platform_status,
            is_verified=payload.is_verified,
            is_sponsored=payload.is_sponsored,
            launched_at=payload.launched_at,
            created_by=created_by,
        )
        await self.repo.create_tool(tool)

        # Associate categories
        cat_ids = set(payload.category_ids)
        if payload.primary_category_id:
            cat_ids.add(payload.primary_category_id)

        for c_id in cat_ids:
            assoc = ToolCategoryModel(tool_id=tool.id, category_id=c_id)
            self.session.add(assoc)

        # Associate tags
        for t_id in payload.tag_ids:
            t_assoc = ToolTagModel(tool_id=tool.id, tag_id=t_id)
            self.session.add(t_assoc)

        # Add pricing plans
        for p in payload.pricing_plans:
            plan = PricingPlanModel(
                tool_id=tool.id,
                name=p.name,
                description=p.description,
                amount_minor=p.amount_minor,
                currency=p.currency,
                billing_interval=p.billing_interval,
                is_free=p.is_free,
                pricing_url=p.pricing_url,
                limitations=p.limitations,
                source_url=p.source_url,
            )
            self.session.add(plan)

        await self.session.flush()
        return await self.get_tool(str(tool.id))

    async def update_tool(self, tool_id: uuid.UUID, payload: ToolUpdate) -> ToolModel:
        tool = await self.repo.get_tool_by_id(tool_id, load_relations=True)
        if not tool:
            raise NotFoundError(f"Tool '{tool_id}' not found")

        update_data = payload.model_dump(exclude_unset=True)

        if "slug" in update_data and update_data["slug"] != tool.slug:
            existing = await self.repo.get_tool_by_slug(update_data["slug"])
            if existing and existing.id != tool.id:
                raise ValidationError(
                    f"Tool slug '{update_data['slug']}' already exists"
                )

        # Handle direct scalar attributes
        category_ids = update_data.pop("category_ids", None)
        tag_ids = update_data.pop("tag_ids", None)

        for key, value in update_data.items():
            setattr(tool, key, value)

        # Update categories if specified
        if category_ids is not None:
            tool.categories.clear()
            for c_id in category_ids:
                tool.categories.append(
                    ToolCategoryModel(tool_id=tool.id, category_id=c_id)
                )

        # Update tags if specified
        if tag_ids is not None:
            tool.tags.clear()
            for t_id in tag_ids:
                tool.tags.append(ToolTagModel(tool_id=tool.id, tag_id=t_id))

        await self.session.flush()
        return await self.get_tool(str(tool.id))

    async def publish_tool(self, tool_id: uuid.UUID) -> ToolModel:
        tool = await self.get_tool(str(tool_id))
        if not tool.website_url:
            raise ValidationError(
                "Tool must have a valid official website URL to be published"
            )
        if not tool.primary_category_id and not tool.categories:
            raise ValidationError(
                "Tool must be assigned to at least one category to be published"
            )

        tool.platform_status = "published"
        tool.updated_at = datetime.now(timezone.utc)
        await self.session.flush()
        return await self.get_tool(str(tool_id))

    async def verify_tool(self, tool_id: uuid.UUID) -> ToolModel:
        tool = await self.get_tool(str(tool_id))
        tool.is_verified = True
        tool.last_verified_at = datetime.now(timezone.utc)
        tool.updated_at = datetime.now(timezone.utc)
        await self.session.flush()
        return await self.get_tool(str(tool_id))

    async def archive_tool(self, tool_id: uuid.UUID) -> ToolModel:
        tool = await self.get_tool(str(tool_id))
        tool.platform_status = "archived"
        tool.updated_at = datetime.now(timezone.utc)
        await self.session.flush()
        return await self.get_tool(str(tool_id))
