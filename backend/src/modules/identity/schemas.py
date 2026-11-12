"""Pydantic schemas for Phase 6: User identity and bookmarks."""

from typing import Optional, List
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
    # Email updates would require verification flow; omitted for now


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

    class Config:
        from_attributes = True


class BookmarkToggleResponse(BaseModel):
    """Response for toggle save/remove a tool bookmark."""

    is_saved: bool
    message: str