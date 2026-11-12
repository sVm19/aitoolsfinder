from datetime import datetime
from typing import Dict, List, Literal, Optional
import uuid

from pydantic import BaseModel, Field, field_validator

from src.modules.catalog.schemas import CategoryRead, PricingPlanRead


SupportLevel = Literal["yes", "partial", "no", "unknown"]


class ComparisonPreviewRequest(BaseModel):
    tool_slugs: List[str] = Field(..., min_length=2, max_length=4)

    @field_validator("tool_slugs")
    @classmethod
    def require_distinct_tools(cls, values: List[str]) -> List[str]:
        if len(set(values)) != len(values):
            raise ValueError("tool_slugs must contain distinct tools")
        return values


class ComparisonToolSummary(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    tagline: Optional[str] = None
    website_url: str
    pricing_model: str
    platform_status: str
    is_verified: bool
    is_sponsored: bool
    primary_category: Optional[CategoryRead] = None

    model_config = {"from_attributes": True}


class ComparisonFeatureRow(BaseModel):
    feature_id: uuid.UUID
    name: str
    slug: str
    feature_group: Optional[str] = None
    support_by_tool: Dict[str, SupportLevel]


class ComparisonMatrix(BaseModel):
    slug: Optional[str] = None
    title: str
    summary: Optional[str] = None
    tools: List[ComparisonToolSummary]
    features: List[ComparisonFeatureRow]
    pricing_by_tool: Dict[str, List[PricingPlanRead]]


class AlternativeItem(BaseModel):
    tool: ComparisonToolSummary
    rationale: Optional[str] = None
    source: Literal["curated", "related"]
    shared_categories: int = 0
    shared_tags: int = 0


class AlternativesResponse(BaseModel):
    tool: ComparisonToolSummary
    alternatives: List[AlternativeItem]


class RankingItem(BaseModel):
    rank: int
    tool: ComparisonToolSummary
    score_version: str
    overall_score: float
    dimension_scores: Dict[str, Optional[float]]
    methodology_url: Optional[str] = None
    evidence: List[str]
    calculated_at: datetime


class RankingResponse(BaseModel):
    taxonomy_type: Literal["category", "tag"]
    taxonomy_name: str
    taxonomy_slug: str
    taxonomy_description: Optional[str] = None
    pricing_filter: Literal["all", "free", "paid"]
    items: List[RankingItem]
    page: int
    page_size: int
    total: int
    total_pages: int
