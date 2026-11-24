"""User identity, authentication, and bookmarks API endpoints for Phase 6."""

import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.database import get_db
from src.core.security import get_current_user, UserContext, create_session_token
from src.modules.identity.models import UserModel, SavedToolModel, FounderProfileModel
from src.modules.identity.cognito_service import (
    send_cognito_code,
    verify_cognito_code,
    CognitoError,
)
from src.modules.identity.schemas import (
    UserRead,
    UserUpdate,
    SavedToolRead,
    BookmarkToggleResponse,
    MagicCodeSendRequest,
    MagicCodeSendResponse,
    MagicCodeVerifyRequest,
    MagicCodeVerifyResponse,
)

router = APIRouter(prefix="/api/v1", tags=["User Identity"])


@router.post("/auth/magic-code/send", response_model=MagicCodeSendResponse)
async def send_magic_code_endpoint(payload: MagicCodeSendRequest) -> MagicCodeSendResponse:
    """Send an official AWS Cognito authentication code to the specified email."""
    try:
        result = send_cognito_code(payload.email)
        return MagicCodeSendResponse(
            success=True,
            message=result["message"],
            destination=result.get("destination"),
            is_new_user=result.get("is_new_user", False),
        )
    except CognitoError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.message,
        )


@router.post("/auth/magic-code/verify", response_model=MagicCodeVerifyResponse)
async def verify_magic_code_endpoint(
    payload: MagicCodeVerifyRequest,
    session: AsyncSession = Depends(get_db),
) -> MagicCodeVerifyResponse:
    """Verify Cognito code, authenticate user, and return session token."""
    try:
        verify_cognito_code(payload.email, payload.code)
    except CognitoError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.message,
        )

    clean_email = payload.email.strip().lower()

    # Look up or JIT-create user in PostgreSQL database
    result = await session.execute(
        select(UserModel).where(UserModel.email == clean_email)
    )
    user = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if not user:
        cognito_sub = f"cognito_{clean_email.replace('@', '_').replace('.', '_')}"
        display_name = clean_email.split("@")[0].capitalize()
        user = UserModel(
            id=uuid.uuid4(),
            cognito_sub=cognito_sub,
            email=clean_email,
            display_name=display_name,
            role="user",
            is_email_verified=True,
            created_at=now,
            updated_at=now,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    else:
        if not user.is_email_verified:
            user.is_email_verified = True
            user.updated_at = now
            await session.commit()
            await session.refresh(user)

    # Check if founder profile exists
    f_res = await session.execute(
        select(FounderProfileModel).where(FounderProfileModel.user_id == user.id)
    )
    founder_profile = f_res.scalar_one_or_none()

    token = create_session_token(
        user_id=str(user.id),
        email=user.email,
        cognito_sub=user.cognito_sub,
        role=user.role,
    )

    user_read = UserRead(
        id=str(user.id),
        cognito_sub=user.cognito_sub,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )

    return MagicCodeVerifyResponse(
        success=True,
        token=token,
        user=user_read,
        has_founder_profile=founder_profile is not None,
    )



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

    # Query saved tools with joined tool data in a single SQL query
    result = await session.execute(
        select(SavedToolModel, CatalogTool)
        .join(CatalogTool, SavedToolModel.tool_id == CatalogTool.id)
        .where(SavedToolModel.user_id == current_user.id)
    )
    rows = result.all()

    output = []
    for st, tool in rows:
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