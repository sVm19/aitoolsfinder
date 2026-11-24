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
        String(128),
        nullable=False,
        unique=True,
        index=True,
        comment="Stable Cognito User Pool sub identifier",
    )
    email: Mapped[str] = mapped_column(
        String(254), nullable=False, unique=True, index=True
    )
    display_name: Mapped[Optional[str]] = mapped_column(
        String(128), nullable=True, comment="Display name shown in dashboard"
    )
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="user",
        comment="Role: user | vendor | admin",
    )
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
        comment="Email verification status",
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
    saved_tools: Mapped[List["SavedToolModel"]] = Relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    founder_profile: Mapped[Optional["FounderProfileModel"]] = Relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class FounderProfileModel(Base):
    """Founder profile containing verified social credentials, bio, and publication links."""

    __tablename__ = "founder_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    founder_name: Mapped[str] = mapped_column(String(128), nullable=False)
    handle: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )
    headline: Mapped[str] = mapped_column(String(160), nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Verified Links
    substack_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    x_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reddit_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    instagram_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Verification Badge
    is_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false"), index=True
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(
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

    # Relationship back to user
    user: Mapped["UserModel"] = Relationship(back_populates="founder_profile")


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
        nullable=False,
    )

    # Relationship back to user
    user: Mapped["UserModel"] = Relationship(back_populates="saved_tools")
