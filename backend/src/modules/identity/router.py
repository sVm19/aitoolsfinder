"""User identity, authentication, and bookmarks API endpoints for Phase 6."""

from typing import List
from fastapi import APIRouter, Depends, Request, Response, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.database import get_db
from src.core.security import get_current_user, UserContext
from src.modules.identity.models import UserModel, SavedToolModel
from src.modules.identity.schemas import (
    UserRead,
    UserUpdate,
    SavedToolRead,
    SaveToolRequest,
    BookmarkToggleResponse,
)

router = APIRouter(prefix="/api/v1", tags=["User Identity"])


@router.get("/users/me", response_model=UserRead)
async def get_current_user_endpoint(
    current_user: UserContext = Depends(get_current_user),
) -> UserRead:
    """Get the profile of the currently authenticated user.

    Returns user ID, email, display name, role, and verification status.
    """
    return UserRead(
        id=current_user.id,
        cognito_sub=current_user.id,  # Cognito sub is stored as the user ID mapping
        email=current_user.email,
        display_name=current_user.display_name,
        role=current_user.role,
        is_email_verified=current_user.is_email_verified,
        created_at=datetime.now(timezone.utc),  # placeholder - would need DB fetch
        updated_at=datetime.now(timezone.utc),
    )


@router.patch("/users/me", response_model=UserRead)
async def update_current_user(
    payload: UserUpdate,
    current_user: UserContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> UserRead:
    """Update the current user's profile.

    Currently supports updating display_name only.
    """
    from datetime import timezone as tz

    if payload.display_name is not None:
        # Update display name in DB
        result = await session.execute(
            select(UserModel).where(UserModel.id == current_user.id)  # type: ignore[attr-defined]
        )
        user = result.scalar_one_or_none()
        if user:
            user.display_name = payload.display_name
            user.updated_at = datetime.now(tz.utc)
            await session.commit()
            await session.refresh(user)

    return UserRead(
        id=current_user.id,
        cognito_sub=current_user.id,
        email=current_user.email,
        display_name=payload.display_name or current_user.display_name,
        role=current_user.role,
        is_email_verified=current_user.is_email_verified,
        created_at=datetime.now(tz.utc),
        updated_at=datetime.now(tz.utc),
    )


@router.get("/users/me/saved-tools", response_model=List[SavedToolRead])
async def get_saved_tools(
    current_user: UserContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> List[SavedToolRead]:
    """Get all tools saved/bookmarked by the current user.

    Returns full tool summaries for each saved tool.
    """
    from src.modules.catalog.models import ToolModel as CatalogTool

    # Query saved tools with joined tool data
    result = await session.execute(
        select(SavedToolModel).where(SavedToolModel.user_id == current_user.id)  # type: ignore[attr-defined]
    )
    saved_tools = result.scalars().all()

    output = []
    for st in saved_tools:
        # Fetch full tool details
        tool_result = await session.execute(
            select(CatalogTool).where(CatalogTool.id == st.tool_id)  # type: ignore[attr-defined]
        )
        tool = tool_result.scalar_one_or_none()

        if tool:
            output.append(
                SavedToolRead(
                    tool_id=str(tool.id),
                    tool_name=tool.name,
                    tool_tagline=tool.tagline,
                    tool_description=tool.description[:100] if tool.description else None,
                    tool_category=tool.primary_category.name if tool.primary_category else None,
                    tool_pricing={  # simplified pricing snapshot
                        "is_free": any(p.is_free for p in (tool.pricing_plans or [])),
                        "amount_minor": (
                            min((p.amount_minor for p in (tool.pricing_plans or []) if p.amount_minor is not None), default=None)
                        ),
                    },
                    saved_at=st.created_at,
                )
            )

    return output


@router.post(
    "/users/me/saved-tools/{tool_id}",
    response_model=BookmarkToggleResponse,
    status_code=status.HTTP_200_OK,
)
async def save_tool_to_bookmarks(
    tool_id: str,
    current_user: UserContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> BookmarkToggleResponse:
    """Save a tool to the user's bookmarks (idempotent).

    If the tool is already saved, it removes it (toggle behavior).
    If the tool is not saved, it adds it.
    """
    from uuid import UUID as UUIDType

    # Parse tool_id to UUID
    try:
        tool_uuid = UUIDType(tool_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tool ID format",
        )

    # Check if already saved
    result = await session.execute(
        select(SavedToolModel).where(
            SavedToolModel.user_id == current_user.id,  # type: ignore[attr-defined]
            SavedToolModel.tool_id == tool_uuid,  # type: ignore[attr-defined]
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Already saved → remove (toggle off)
        await session.delete(existing)
        await session.commit()
        return BookmarkToggleResponse(
            is_saved=False,
            message="Tool removed from bookmarks.",
        )
    else:
        # Not saved → add (toggle on)
        new_bookmark = SavedToolModel(
            user_id=current_user.id,  # type: ignore[attr-defined]
            tool_id=tool_uuid,
            created_at=datetime.now(timezone.utc),
        )
        session.add(new_bookmark)
        await session.commit()
        await session.refresh(new_bookmark)
        return BookmarkToggleResponse(
            is_saved=True,
            message="Tool saved to bookmarks.",
        )


@router.delete(
    "/users/me/saved-tools/{tool_id}",
    response_model=BookmarkToggleResponse,
    status_code=status.HTTP_200_OK,
)
async def remove_tool_from_bookmarks(
    tool_id: str,
    current_user: UserContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> BookmarkToggleResponse:
    """Remove a tool from the user's bookmarks.

    Returns whether the tool was successfully removed.
    """
    from uuid import UUID as UUIDType

    # Parse tool_id to UUID
    try:
        tool_uuid = UUIDType(tool_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tool ID format",
        )

    # Find and delete the bookmark
    result = await session.execute(
        select(SavedToolModel).where(
            SavedToolModel.user_id == current_user.id,  # type: ignore[attr-defined]
            SavedToolModel.tool_id == tool_uuid,  # type: ignore[attr-defined]
        )
    )
    existing = result.scalar_one_or_none()

    if existing is None:
        # Not found - still return success but with appropriate message
        return BookmarkToggleResponse(
            is_saved=False,
            message="Tool was not in your bookmarks.",
        )

    await session.delete(existing)
    await session.commit()
    return BookmarkToggleResponse(
        is_saved=False,
        message="Tool removed from bookmarks.",
    )