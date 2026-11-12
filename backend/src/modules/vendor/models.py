"""SQLAlchemy models for Phase 7: Monetization and vendor submissions."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    String,
    Text,
    Boolean,
    Uuid,
    DateTime,
    ForeignKey,
    func,
    text,
    Table,
    Column,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, Relationship, registry

from src.core.database import Base


# Association table for tool-submission to tags
tool_submission_tags = Table(
    "tool_submissions_tags",
    Base.metadata,
    Column("tool_submission_id", Uuid(as_uuid=True), ForeignKey("tool_submissions.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Uuid(as_uuid=True), ForeignKey("tags.id", ondelete="SET NULL"), nullable=True),
)


# Association table for tool-submission to features
tool_submission_features = Table(
    "tool_submission_features",
    Base.metadata,
    Column("tool_submission_id", Uuid(as_uuid=True), ForeignKey("tool_submissions.id", ondelete="CASCADE"), primary_key=True),
    Column("feature_id", Uuid(as_uuid=True), ForeignKey("features.id", ondelete="SET NULL"), nullable=True),
)


class VendorModel(Base):
    """Vendor/company that submits tools to the platform."""

    __tablename__ = "vendors"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(254), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    tool_submissions: Mapped[List["ToolSubmissionModel"]] = Relationship(
        back_populates="vendor",
        cascade="all, delete-orphan",
    )


class ToolSubmissionModel(Base):
    """A tool submission from a vendor, going through moderation before being published."""

    __tablename__ = "tool_submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False
    )
    tool_name: Mapped[str] = mapped_column(String(254), nullable=False)
    tool_slug: Mapped[str] = mapped_column(
        String(128), nullable=False,
        comment="Generated slug, must be unique when published"
    )
    tagline: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    primary_category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    pricing_model: Mapped[str] = mapped_column(String(50), nullable=False, server_default="free")
    is_free: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    starting_price_minor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default="USD")
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="pending",
        comment="pending | under_review | approved | rejected"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    vendor: Mapped["VendorModel"] = Relationship(back_populates="tool_submissions")
    category: Mapped[Optional["CategoryModel"]] = Relationship()
    features: Mapped[List["FeatureModel"]] = Relationship(
        secondary=tool_submission_features,
    )


class AffiliateLinkModel(Base):
    """An affiliate link associated with a tool for tracking clicks and commissions."""

    __tablename__ = "affiliate_links"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tools.id", ondelete="CASCADE"), nullable=False
    )
    provider: Mapped[str] = mapped_column(String(100), nullable=False, default="resend")
    provider_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_approved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    tool: Mapped["ToolModel"] = Relationship()


class OutboundClickModel(Base):
    """A record of an outbound click from our site to a tool's affiliate link."""

    __tablename__ = "outbound_clicks"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tools.id", ondelete="CASCADE"), nullable=False
    )
    clicked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    tool: Mapped["ToolModel"] = Relationship()


class PaymentEventModel(Base):
    """A payment event from Tiun Business webhook, processed idempotently."""

    __tablename__ = "payment_events"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False, default="tiun")
    provider_event_id: Mapped[str] = mapped_column(
        String(128), nullable=False,
        comment="Unique ID from the provider, used for deduplication"
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, default="subscription_created")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="processed",
        comment="processed | completed | failed"
    )
    event_metadata: Mapped[Optional[str]] = mapped_column("metadata", Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "provider",
            "provider_event_id",
            name="uq_payment_events_provider_event",
        ),
    )



class SubscriptionModel(Base):
    """A user subscription status, linked to a payment event."""

    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    provider_subscription_id: Mapped[str] = mapped_column(
        String(128), nullable=False,
        comment="ID from the provider (Tiun Business)"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active",
        comment="active | cancelled | past_due | completed"
    )
    pricing_plan_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("pricing_plans.id", ondelete="SET NULL"), nullable=True
    )
    current_period_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    current_period_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancel_at_period_end: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    pricing_plan: Mapped[Optional["PricingPlanModel"]] = Relationship()