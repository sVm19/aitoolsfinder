import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from src.core.database import Base
from src.modules.catalog.models import ToolModel


JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")


class ComparisonModel(Base):
    __tablename__ = "comparisons"
    __table_args__ = (UniqueConstraint("slug", name="uq_comparisons_slug"),)

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="draft", server_default="draft", nullable=False
    )
    # The users FK is added by the Phase 6 migration once users exists.
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(
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

    tool_associations: Mapped[List["ComparisonToolModel"]] = relationship(
        back_populates="comparison", cascade="all, delete-orphan"
    )


class ComparisonToolModel(Base):
    __tablename__ = "comparison_tools"
    __table_args__ = (
        UniqueConstraint("comparison_id", "position", name="uq_comparison_tools_position"),
    )

    comparison_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("comparisons.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True
    )
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    comparison: Mapped[ComparisonModel] = relationship(
        back_populates="tool_associations"
    )
    tool: Mapped["ToolModel"] = relationship()


class ToolAlternativeModel(Base):
    __tablename__ = "tool_alternatives"
    __table_args__ = (
        CheckConstraint("tool_id <> alternative_tool_id", name="ck_tool_alternatives_not_self"),
    )

    tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tools.id", ondelete="CASCADE"),
        primary_key=True,
    )
    alternative_tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tools.id", ondelete="CASCADE"),
        primary_key=True,
    )
    rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    tool: Mapped["ToolModel"] = relationship(foreign_keys=[tool_id])
    alternative_tool: Mapped["ToolModel"] = relationship(
        foreign_keys=[alternative_tool_id]
    )


class ScoreHistoryModel(Base):
    __tablename__ = "score_history"
    __table_args__ = (
        UniqueConstraint(
            "tool_id",
            "score_version",
            "calculated_at",
            name="uq_score_history_tool_version_time",
        ),
        Index(
            "ix_score_history_tool_calculated_at",
            "tool_id",
            text("calculated_at DESC"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tools.id", ondelete="CASCADE"), nullable=False
    )
    score_version: Mapped[str] = mapped_column(String(50), nullable=False)
    overall_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    dimension_scores: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)
    methodology_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence: Mapped[list] = mapped_column(
        JSON_TYPE, default=list, server_default=text("'[]'"), nullable=False
    )
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    tool: Mapped["ToolModel"] = relationship()
