"""Pydantic schemas for Phase 7: Monetization and vendor submissions."""

from typing import Optional, List, Dict
from pydantic import BaseModel, Field, validator


class SubmissionCreate(BaseModel):
    """Request schema for creating a new tool submission."""

    tool_name: str = Field(min_length=1, max_length=254, description="Name of the tool")
    tagline: str = Field(min_length=1, max_length=500, description="Short tagline describing the tool")
    description: Optional[str] = Field(
        default=None, max_length=2000, description="Detailed description of the tool"
    )
    primary_category_id: Optional[str] = Field(
        default=None, max_length=36, description="UUID of the primary category"
    )
    pricing_model: str = Field(
        default="free",
        pattern="^(free|freemium|paid|one-time|custom)$",
        description="Pricing model: free, freemium, paid, one-time, custom",
    )
    is_free: bool = Field(default=True, description="Whether the tool has a free tier")
    starting_price_minor: Optional[int] = Field(
        default=None, ge=0, le=999999,
        description="Starting price in minor units (cents), e.g. 2900 = $29.00"
    )
    currency: str = Field(default="USD", pattern="^[A-Z]{3}$", description="ISO 4217 currency code")
    website_url: Optional[str] = Field(
        default=None, max_length=500, pattern="^https?://",
        description="Official website URL of the tool"
    )
    submitter_email: Optional[str] = Field(
        default=None, max_length=254, description="Email of the submitter"
    )


class SubmissionApprove(BaseModel):
    """Request schema for approving a vendor submission."""

    pass  # No additional fields needed - just the submission ID in the URL


class SubmissionReject(BaseModel):
    """Request schema for rejecting a vendor submission."""

    feedback: Optional[str] = Field(
        default=None, max_length=500, description="Feedback reason for rejection"
    )


class SubmissionRead(BaseModel):
    """Read schema for a tool submission."""

    id: str
    vendor_name: Optional[str] = None
    tool_name: str
    tool_slug: str
    tagline: str
    description: Optional[str] = None
    primary_category: Optional[str] = None
    pricing_model: str
    is_free: bool
    starting_price_minor: Optional[int] = None
    currency: str
    website_url: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SubmissionListItem(BaseModel):
    """Light read schema for listing submissions in admin queue."""

    id: str
    vendor_name: str
    tool_name: str
    tool_slug: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AffiliateLinkCreate(BaseModel):
    """Request schema for creating an affiliate link."""

    provider: str = Field(default="resend", max_length=100, description="Affiliate provider")
    provider_url: str = Field(
        min_length=1, max_length=500,
        description="The affiliate or official destination URL"
    )


class AffiliateLinkRead(BaseModel):
    """Read schema for an affiliate link."""

    id: str
    provider: str
    provider_url: str
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OutboundClickCreate(BaseModel):
    """Request schema for recording an outbound click."""

    pass  # No fields needed - tool_id and IP come from request


class OutboundClickRead(BaseModel):
    """Read schema for an outbound click record."""

    click_id: str
    redirect_url: str

    class Config:
        from_attributes = True


class PaymentEventCreate(BaseModel):
    """Request schema for a payment event (from webhook)."""

    provider: str = Field(default="tiun", max_length=50, description="Payment provider")
    provider_event_id: str = Field(
        min_length=1, max_length=128,
        description="Unique event ID from the provider for deduplication"
    )
    event_type: str = Field(
        default="subscription_created",
        max_length=50,
        description="Type of event: subscription_created, subscription_updated, subscription_cancelled"
    )
    metadata: Optional[Dict] = Field(default=None, description="Additional event metadata")


class PaymentEventRead(BaseModel):
    """Read schema for a payment event."""

    id: str
    provider: str
    provider_event_id: str
    event_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict] = None

    class Config:
        from_attributes = True


class SubscriptionRead(BaseModel):
    """Read schema for a subscription status."""

    id: str
    user_id: str
    provider_subscription_id: str
    status: str = "active"
    pricing_plan: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True