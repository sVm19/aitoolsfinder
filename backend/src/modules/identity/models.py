"""SQLAlchemy models for Phase 6: User identity and bookmarks."""

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
)
from sqlalchemy.orm import Mapped, mapped_column, Relationship

from src.core.database import Base


class UserModel(Base):
    """User account, created via JIT upon first valid Cognito token presentation."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cognito_sub: Mapped[str] = mapped_column(
        String(128), nullable=False, unique=True, index=True,
        comment="Stable Cognito User Pool sub identifier"
    )
    email: Mapped[str] = mapped_column(
        String(254), nullable=False, unique=True, index=True
    )
    display_name: Mapped[Optional[str]] = mapped_column(
        String(128), nullable=True,
        comment="Display name shown in dashboard"
    )
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="user",
        comment="Role: user | vendor | admin"
    )
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false"),
        comment="Email verification status"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    saved_tools: Mapped[List["SavedToolModel"]] = Relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class SavedToolModel(Base):
    """Bookmark association: user saved a tool for quick access."""

    __tablename__ = "saved_tools"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tool_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tools.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )

    # Relationship back to user
    user: Mapped["UserModel"] = Relationship(
        back_populates="saved_tools"
    )