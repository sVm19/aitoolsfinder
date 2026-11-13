import math
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import require_role
from src.common.schemas import PaginatedResponse
from src.modules.catalog.service import CatalogService
from src.modules.catalog.schemas import (
    CategoryCreate,
    CategoryUpdate,
    CategoryRead,
    TagCreate,
    TagRead,
    ToolCreate,
    ToolUpdate,
    ToolRead,
    ToolAutocompleteItem,
    ToolDetailRead,
)

router = APIRouter(tags=["Catalog"])
admin_router = APIRouter(
    prefix="/admin",
    tags=["Admin - Catalog"],
    dependencies=[Depends(require_role(["admin"]))],
)


# ==============================================================================
# Public Endpoints - Categories
# ==============================================================================
@router.get("/categories", response_model=PaginatedResponse[CategoryRead])
async def list_categories(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=50, ge=1, le=100, description="Items per page"),
    only_active: bool = Query(
        default=True, description="Filter only active categories"
    ),
    session: AsyncSession = Depends(get_db),
):
    service = CatalogService(session)
    skip = (page - 1) * page_size
    items, total = await service.list_categories(
        only_active=only_active, skip=skip, limit=page_size
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        items=[CategoryRead.model_validate(c) for c in items],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.get("/categories/{slug}", response_model=CategoryRead)
async def get_category(slug: str, session: AsyncSession = Depends(get_db)):
    service = CatalogService(session)
    category = await service.get_category(slug)
    return CategoryRead.model_validate(category)


# ==============================================================================
# Public Endpoints - Tags
# ==============================================================================
@router.get("/tags", response_model=PaginatedResponse[TagRead])
async def list_tags(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=100, ge=1, le=200, description="Items per page"),
    session: AsyncSession = Depends(get_db),
):
    service = CatalogService(session)
    skip = (page - 1) * page_size
    items, total = await service.list_tags(skip=skip, limit=page_size)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        items=[TagRead.model_validate(t) for t in items],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.get("/tags/{slug}", response_model=TagRead)
async def get_tag(slug: str, session: AsyncSession = Depends(get_db)):
    service = CatalogService(session)
    tag = await service.get_tag(slug)
    return TagRead.model_validate(tag)


# ==============================================================================
# Public Endpoints - Tools
# ==============================================================================
@router.get("/tools", response_model=PaginatedResponse[ToolRead])
@router.get("/search", response_model=PaginatedResponse[ToolRead])
async def list_tools(
    q: Optional[str] = Query(default=None, max_length=120, description="Search published tool names and details"),
    category: Optional[list[str]] = Query(default=None, description="Category slug(s); repeat or comma-separate for multiple"),
    tags: Optional[list[str]] = Query(default=None, description="Tag slug(s); repeat or comma-separate for multiple"),
    tag: Optional[str] = Query(default=None, description="Legacy single tag slug"),
    pricing_model: Optional[str] = Query(
        default=None,
        pattern="^(free|freemium|paid|usage_based|contact_sales|unknown)$",
        description="Pricing model filter",
    ),
    is_verified: Optional[bool] = Query(default=None, description="Verified tools only or unverified tools only"),
    sort: Optional[str] = Query(
        default=None,
        pattern="^(newest|alphabetical|relevance)$",
        description="Sort order; defaults to relevance for a query and newest otherwise",
    ),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_db),
):
    tag_slugs = [
        slug.strip()
        for value in [*(tags or []), *([tag] if tag else [])]
        for slug in value.split(",")
        if slug.strip()
    ]
    category_slugs = [
        slug.strip()
        for value in (category or [])
        for slug in value.split(",")
        if slug.strip()
    ]
    service = CatalogService(session)
    items, total = await service.list_tools(
        status="published",
        category_slugs=category_slugs or None,
        tag_slugs=tag_slugs or None,
        pricing_model=pricing_model,
        is_verified=is_verified,
        query=q,
        sort=sort or ("relevance" if q else "newest"),
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        items=[ToolRead.model_validate(t) for t in items],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.get("/search/autocomplete", response_model=list[ToolAutocompleteItem])
async def autocomplete_tools(
    q: str = Query(min_length=2, max_length=80, description="Tool name prefix or approximate name"),
    limit: int = Query(default=8, ge=1, le=10),
    session: AsyncSession = Depends(get_db),
):
    service = CatalogService(session)
    items = await service.autocomplete_tools(q, limit=limit)
    return [ToolAutocompleteItem.model_validate(item) for item in items]


@router.get("/tools/{slug}", response_model=ToolDetailRead)
async def get_tool(slug: str, session: AsyncSession = Depends(get_db)):
    service = CatalogService(session)
    tool = await service.get_published_tool(slug)
    return ToolDetailRead.model_validate(tool)


# ==============================================================================
# Admin Endpoints - Categories
# ==============================================================================
@admin_router.post(
    "/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED
)
async def create_category(
    payload: CategoryCreate, session: AsyncSession = Depends(get_db)
):
    service = CatalogService(session)
    category = await service.create_category(payload)
    return CategoryRead.model_validate(category)


@admin_router.patch("/categories/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: uuid.UUID,
    payload: CategoryUpdate,
    session: AsyncSession = Depends(get_db),
):
    service = CatalogService(session)
    category = await service.update_category(category_id, payload)
    return CategoryRead.model_validate(category)


# ==============================================================================
# Admin Endpoints - Tags
# ==============================================================================
@admin_router.post("/tags", response_model=TagRead, status_code=status.HTTP_201_CREATED)
async def create_tag(payload: TagCreate, session: AsyncSession = Depends(get_db)):
    service = CatalogService(session)
    tag = await service.create_tag(payload)
    return TagRead.model_validate(tag)


# ==============================================================================
# Admin Endpoints - Tools
# ==============================================================================
@admin_router.post(
    "/tools", response_model=ToolDetailRead, status_code=status.HTTP_201_CREATED
)
async def create_tool(payload: ToolCreate, session: AsyncSession = Depends(get_db)):
    service = CatalogService(session)
    tool = await service.create_tool(payload)
    return ToolDetailRead.model_validate(tool)


@admin_router.patch("/tools/{tool_id}", response_model=ToolDetailRead)
async def update_tool(
    tool_id: uuid.UUID,
    payload: ToolUpdate,
    session: AsyncSession = Depends(get_db),
):
    service = CatalogService(session)
    tool = await service.update_tool(tool_id, payload)
    return ToolDetailRead.model_validate(tool)


@admin_router.post("/tools/{tool_id}/publish", response_model=ToolDetailRead)
async def publish_tool(tool_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    service = CatalogService(session)
    tool = await service.publish_tool(tool_id)
    return ToolDetailRead.model_validate(tool)


@admin_router.post("/tools/{tool_id}/verify", response_model=ToolDetailRead)
async def verify_tool(tool_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    service = CatalogService(session)
    tool = await service.verify_tool(tool_id)
    return ToolDetailRead.model_validate(tool)


@admin_router.post("/tools/{tool_id}/archive", response_model=ToolDetailRead)
async def archive_tool(tool_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    service = CatalogService(session)
    tool = await service.archive_tool(tool_id)
    return ToolDetailRead.model_validate(tool)
