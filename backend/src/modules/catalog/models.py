import uuid
from datetime import datetime, date, timezone
from typing import List, Optional, Any, Dict
from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Uuid,
    JSON,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class CategoryModel(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    seo_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
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
    tool_associations: Mapped[List["ToolCategoryModel"]] = relationship(
        "ToolCategoryModel", back_populates="category", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_categories_sort_order", "sort_order"),)


class TagModel(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    tool_associations: Mapped[List["ToolTagModel"]] = relationship(
        "ToolTagModel", back_populates="tag", cascade="all, delete-orphan"
    )


class ToolModel(Base):
    __tablename__ = "tools"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    tagline: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    search_vector: Mapped[Any] = mapped_column(
        TSVECTOR().with_variant(Text, "sqlite"),
        nullable=False,
        server_default=text("''"),
    )
    website_url: Mapped[str] = mapped_column(Text, nullable=False)
    logo_object_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    primary_category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    pricing_model: Mapped[str] = mapped_column(
        String(50), default="unknown", nullable=False, index=True
    )
    platform_status: Mapped[str] = mapped_column(
        String(50), default="draft", nullable=False, index=True
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_sponsored: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    launched_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), nullable=True
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
    primary_category: Mapped[Optional["CategoryModel"]] = relationship(
        "CategoryModel", foreign_keys=[primary_category_id]
    )
    categories: Mapped[List["ToolCategoryModel"]] = relationship(
        "ToolCategoryModel", back_populates="tool", cascade="all, delete-orphan"
    )
    tags: Mapped[List["ToolTagModel"]] = relationship(
        "ToolTagModel", back_populates="tool", cascade="all, delete-orphan"
    )
    features: Mapped[List["ToolFeatureModel"]] = relationship(
        "ToolFeatureModel", back_populates="tool", cascade="all, delete-orphan"
    )
    pricing_plans: Mapped[List["PricingPlanModel"]] = relationship(
        "PricingPlanModel", back_populates="tool", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_tools_status_updated", "platform_status", "updated_at"),
        Index("ix_tools_primary_cat", "primary_category_id"),
    )


class ToolCategoryModel(Base):
    __tablename__ = "tool_categories"

    tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tools.id", ondelete="CASCADE"),
        primary_key=True,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        primary_key=True,
    )

    tool: Mapped["ToolModel"] = relationship("ToolModel", back_populates="categories")
    category: Mapped["CategoryModel"] = relationship(
        "CategoryModel", back_populates="tool_associations"
    )


class ToolTagModel(Base):
    __tablename__ = "tool_tags"

    tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tools.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    )

    tool: Mapped["ToolModel"] = relationship("ToolModel", back_populates="tags")
    tag: Mapped["TagModel"] = relationship(
        "TagModel", back_populates="tool_associations"
    )


class FeatureModel(Base):
    __tablename__ = "features"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feature_group: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class ToolFeatureModel(Base):
    __tablename__ = "tool_features"

    tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tools.id", ondelete="CASCADE"),
        primary_key=True,
    )
    feature_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("features.id", ondelete="CASCADE"),
        primary_key=True,
    )
    support_level: Mapped[str] = mapped_column(
        String(50), default="unknown", nullable=False
    )
    evidence_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    tool: Mapped["ToolModel"] = relationship("ToolModel", back_populates="features")
    feature: Mapped["FeatureModel"] = relationship("FeatureModel")


class PricingPlanModel(Base):
    __tablename__ = "pricing_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amount_minor: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    currency: Mapped[Optional[str]] = mapped_column(String(3), nullable=True)
    billing_interval: Mapped[str] = mapped_column(
        String(50), default="unknown", nullable=False
    )
    is_free: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    limitations: Mapped[Dict[str, Any]] = mapped_column(
        JSON, default=dict, nullable=False
    )
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
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

    tool: Mapped["ToolModel"] = relationship(
        "ToolModel", back_populates="pricing_plans"
    )

    __table_args__ = (Index("ix_pricing_plans_tool_free", "tool_id", "is_free"),)
