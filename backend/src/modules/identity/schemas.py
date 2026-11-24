"""Pydantic schemas for Phase 6: User identity, bookmarks, and Cognito auth."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserRead(BaseModel):
    """Read schema for user profile data."""

    id: str
    cognito_sub: str
    email: str
    display_name: Optional[str] = None
    role: str = "user"
    is_email_verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Update schema for user profile (display name, preferences)."""

    display_name: Optional[str] = Field(default=None, max_length=128)


class SavedToolRead(BaseModel):
    """Read schema for a saved tool bookmark with full tool summary."""

    tool_id: str
    tool_name: str
    tool_tagline: Optional[str] = None
    tool_description: Optional[str] = None
    tool_category: Optional[str] = None
    tool_pricing: Optional[dict] = None
    saved_at: datetime

    class Config:
        from_attributes = True


class SaveToolRequest(BaseModel):
    """Request schema for saving a tool to user's bookmarks."""

    tool_id: str = Field(min_length=1, max_length=64)


class BookmarkToggleResponse(BaseModel):
    """Response for toggle save/remove a tool bookmark."""

    is_saved: bool
    message: str


class FounderProfileCreate(BaseModel):
    """Payload to create or complete founder profile during onboarding."""

    founder_name: str = Field(min_length=2, max_length=128)
    handle: str = Field(min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_]{3,30}$")
    headline: str = Field(min_length=3, max_length=160)
    bio: str = Field(min_length=10, max_length=2000)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    substack_url: Optional[str] = Field(default=None, max_length=255)
    x_url: Optional[str] = Field(default=None, max_length=255)
    linkedin_url: Optional[str] = Field(default=None, max_length=255)
    github_url: Optional[str] = Field(default=None, max_length=255)
    reddit_url: Optional[str] = Field(default=None, max_length=255)
    instagram_url: Optional[str] = Field(default=None, max_length=255)


class FounderProfileUpdate(BaseModel):
    """Payload to update an existing founder profile."""

    founder_name: Optional[str] = Field(default=None, min_length=2, max_length=128)
    handle: Optional[str] = Field(
        default=None, min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_]{3,30}$"
    )
    headline: Optional[str] = Field(default=None, min_length=3, max_length=160)
    bio: Optional[str] = Field(default=None, min_length=10, max_length=2000)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    substack_url: Optional[str] = Field(default=None, max_length=255)
    x_url: Optional[str] = Field(default=None, max_length=255)
    linkedin_url: Optional[str] = Field(default=None, max_length=255)
    github_url: Optional[str] = Field(default=None, max_length=255)
    reddit_url: Optional[str] = Field(default=None, max_length=255)
    instagram_url: Optional[str] = Field(default=None, max_length=255)


class FounderProfilePublicRead(BaseModel):
    """Publicly visible founder profile."""

    id: str
    founder_name: str
    handle: str
    headline: str
    bio: str
    avatar_url: Optional[str] = None
    substack_url: Optional[str] = None
    x_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    reddit_url: Optional[str] = None
    instagram_url: Optional[str] = None
    is_verified: bool
    verified_at: Optional[datetime] = None
    products_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class MagicCodeSendRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)


class MagicCodeSendResponse(BaseModel):
    success: bool
    message: str
    destination: Optional[str] = None
    is_new_user: bool = False


class MagicCodeVerifyRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    code: str = Field(min_length=4, max_length=10)


class MagicCodeVerifyResponse(BaseModel):
    success: bool
    token: str
    user: UserRead
    has_founder_profile: bool = False
