import uuid
import re
from datetime import datetime, date
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


# ==============================================================================
# Category Schemas
# ==============================================================================
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    seo_title: Optional[str] = Field(None, max_length=255)
    seo_description: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryRead(BaseModel):
    id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    name: str
    slug: str
    description: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ==============================================================================
# Tag Schemas
# ==============================================================================
class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: Optional[str] = Field(None, max_length=100)


class TagCreate(TagBase):
    pass


class TagRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ==============================================================================
# Feature Schemas
# ==============================================================================
class FeatureBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    feature_group: Optional[str] = Field(None, max_length=100)


class FeatureCreate(FeatureBase):
    pass


class FeatureRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    feature_group: Optional[str] = None

    model_config = {"from_attributes": True}


class ToolFeatureAssociation(BaseModel):
    feature_id: uuid.UUID
    support_level: str = Field(default="yes", pattern="^(yes|partial|no|unknown)$")
    evidence_url: Optional[str] = None
    notes: Optional[str] = None


class ToolFeatureRead(BaseModel):
    feature: FeatureRead
    support_level: str
    evidence_url: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


# ==============================================================================
# Pricing Plan Schemas
# ==============================================================================
class PricingPlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    amount_minor: Optional[int] = Field(
        None, ge=0, description="Amount in minor currency units (cents)"
    )
    currency: Optional[str] = Field(default="USD", min_length=3, max_length=3)
    billing_interval: str = Field(
        default="monthly", pattern="^(one_time|monthly|yearly|usage_based|unknown)$"
    )
    is_free: bool = False
    pricing_url: Optional[str] = None
    limitations: Dict[str, Any] = Field(default_factory=dict)
    source_url: Optional[str] = None


class PricingPlanCreate(PricingPlanBase):
    pass


class PricingPlanRead(PricingPlanBase):
    id: uuid.UUID
    tool_id: uuid.UUID
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ==============================================================================
# Tool Schemas
# ==============================================================================
class ToolBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    tagline: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    website_url: str = Field(..., description="Official product URL")
    logo_object_key: Optional[str] = None
    primary_category_id: Optional[uuid.UUID] = None
    pricing_model: str = Field(
        default="unknown",
        pattern="^(free|freemium|paid|usage_based|contact_sales|unknown)$",
    )
    platform_status: str = Field(
        default="draft", pattern="^(draft|pending_review|published|rejected|archived)$"
    )
    is_verified: bool = False
    is_sponsored: bool = False
    launched_at: Optional[date] = None

    @field_validator("website_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("website_url must start with http:// or https://")
        return v


class ToolCreate(ToolBase):
    category_ids: List[uuid.UUID] = Field(default_factory=list)
    tag_ids: List[uuid.UUID] = Field(default_factory=list)
    features: List[ToolFeatureAssociation] = Field(default_factory=list)
    pricing_plans: List[PricingPlanCreate] = Field(default_factory=list)


class ToolUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    logo_object_key: Optional[str] = None
    primary_category_id: Optional[uuid.UUID] = None
    pricing_model: Optional[str] = Field(
        None, pattern="^(free|freemium|paid|usage_based|contact_sales|unknown)$"
    )
    platform_status: Optional[str] = Field(
        None, pattern="^(draft|pending_review|published|rejected|archived)$"
    )
    is_verified: Optional[bool] = None
    is_sponsored: Optional[bool] = None
    launched_at: Optional[date] = None
    category_ids: Optional[List[uuid.UUID]] = None
    tag_ids: Optional[List[uuid.UUID]] = None


class ToolRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    website_url: str
    logo_object_key: Optional[str] = None
    primary_category_id: Optional[uuid.UUID] = None
    pricing_model: str
    platform_status: str
    is_verified: bool
    is_sponsored: bool
    launched_at: Optional[date] = None
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ToolAutocompleteItem(BaseModel):
    name: str
    slug: str
    tagline: Optional[str] = None

    model_config = {"from_attributes": True}


class ToolDetailRead(ToolRead):
    primary_category: Optional[CategoryRead] = None
    categories: List[CategoryRead] = Field(default_factory=list)
    tags: List[TagRead] = Field(default_factory=list)
    pricing_plans: List[PricingPlanRead] = Field(default_factory=list)

    @field_validator("categories", mode="before")
    @classmethod
    def extract_categories(cls, v: Any) -> Any:
        if v and isinstance(v, list):
            return [getattr(item, "category", item) for item in v]
        return v

    @field_validator("tags", mode="before")
    @classmethod
    def extract_tags(cls, v: Any) -> Any:
        if v and isinstance(v, list):
            return [getattr(item, "tag", item) for item in v]
        return v

    model_config = {"from_attributes": True}
