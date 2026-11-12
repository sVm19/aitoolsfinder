"""Backend submission module for Phase 7: Monetization and vendor submissions."""

from fastapi import APIRouter, Depends, Request, Response, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional

from src.core.database import get_db
from src.core.security import (
    get_current_user,
    UserContext,
    require_role,
    is_safe_outbound_url,
)
from src.modules.vendor.models import (
    VendorModel,
    ToolSubmissionModel,
    AffiliateLinkModel,
    OutboundClickModel,
    PaymentEventModel,
    SubscriptionModel,
)
from src.modules.catalog.models import ToolModel, CategoryModel, FeatureModel
from src.modules.vendor.schemas import (
    SubmissionCreate,
    SubmissionApprove,
    SubmissionReject,
    SubmissionRead,
    SubmissionListItem,
    AffiliateLinkCreate,
    AffiliateLinkRead,
    OutboundClickCreate,
    OutboundClickRead,
    PaymentEventCreate,
    PaymentEventRead,
    SubscriptionRead,
)
from src.modules.notifications.service import send_submission_email


router = APIRouter(prefix="/api/v1", tags=["Vendor Submissions"])


@router.post("/submissions", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
async def create_submission(
    payload: SubmissionCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(get_current_user),
) -> SubmissionRead:
    """Create a new tool submission from a vendor.

    If unauthenticated, creates a submission with anonymous contact info.
    If authenticated, links to the user's vendor profile.
    """
    from uuid import UUID as UUIDType

    # Generate slug from tool name
    slug = payload.tool_name.lower().replace(" ", "-").replace("__", "-")

    # Check if a submission with this slug already exists in pending/approved status
    result = await session.execute(
        select(ToolSubmissionModel).where(
            ToolSubmissionModel.tool_slug == slug,
            ToolSubmissionModel.status.in_(["pending", "approved"]),
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        # Append a number to make it unique
        slug = f"{slug}-{uuid.uuid4().hex[:8]}"

    # If authenticated user, link to their vendor profile
    vendor_id = None
    if current_user and current_user.role == "vendor":
        # Find or create vendor profile for this user
        result = await session.execute(
            select(VendorModel).where(VendorModel.email == current_user.email)
        )
        vendor = result.scalar_one_or_none()
        if not vendor:
            vendor = VendorModel(
                name=current_user.display_name or "Unknown Vendor",
                email=current_user.email,
            )
            session.add(vendor)
            await session.flush()
        vendor_id = vendor.id

    submission = ToolSubmissionModel(
        vendor_id=vendor_id,
        tool_name=payload.tool_name,
        tool_slug=slug,
        tagline=payload.tagline,
        description=payload.description,
        primary_category_id=payload.primary_category_id,
        pricing_model=payload.pricing_model,
        is_free=payload.is_free,
        starting_price_minor=payload.starting_price_minor,
        currency=payload.currency,
        website_url=payload.website_url,
        status="pending",
    )

    session.add(submission)
    await session.commit()
    await session.refresh(submission)

    # Send confirmation email
    await send_submission_email(
        submission_id=str(submission.id),
        vendor_email=current_user.email if current_user else payload.submitter_email,
        status="received",
    )

    return SubmissionRead.from_orm(submission)


@router.get("/admin/submissions", response_model=List[SubmissionListItem])
async def list_pending_submissions(
    session: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(require_role(["admin"])),
) -> List[SubmissionListItem]:
    """List all pending submissions for admin review."""
    result = await session.execute(
        select(ToolSubmissionModel).where(ToolSubmissionModel.status == "pending")
    )
    submissions = result.scalars().all()

    return [
        SubmissionListItem(
            id=str(s.id),
            vendor_name=s.vendor.name if s.vendor else "Unknown",
            tool_name=s.tool_name,
            tool_slug=s.tool_slug,
            status=s.status,
            created_at=s.created_at,
        )
        for s in submissions
    ]


@router.post("/admin/submissions/{submission_id}/approve", response_model=SubmissionRead)
async def approve_submission(
    submission_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(require_role(["admin"])),
) -> SubmissionRead:
    """Approve a vendor submission and publish it as a live tool."""

    # Find the submission
    result = await session.execute(
        select(ToolSubmissionModel).where(ToolSubmissionModel.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    if submission.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission is not in pending status",
        )

    # Check if a tool with this slug already exists
    from src.modules.catalog.models import ToolModel as CatalogTool
    result = await session.execute(
        select(CatalogTool).where(CatalogTool.slug == submission.tool_slug)
    )
    existing_tool = result.scalar_one_or_none()
    if existing_tool:
        # Append a number to make the slug unique
        submission.tool_slug = f"{submission.tool_slug}-{uuid.uuid4().hex[:8]}"

    # Create the live tool record
    from datetime import timezone as tz
    from sqlalchemy import UUID as SQLUUID

    # Get or create the primary category
    primary_category_id = submission.primary_category_id
    category = None
    if primary_category_id:
        result = await session.execute(
            select(CategoryModel).where(CategoryModel.id == primary_category_id)
        )
        category = result.scalar_one_or_none()

    # Create the tool
    tool_id = uuid.uuid4()
    tool = CatalogTool(
        id=tool_id,
        slug=submission.tool_slug,
        name=submission.tool_name,
        tagline=submission.tagline,
        description=submission.description,
        primary_category_id=primary_category_id,
        pricing_model=submission.pricing_model,
        platform_status="active",
        is_verified=False,
        is_sponsored=False,
        launched_at=None,
        last_verified_at=None,
        created_at=datetime.now(tz.utc),
        updated_at=datetime.now(tz.utc),
    )
    session.add(tool)

    # Link the submission to the tool (we could add a reference, but for now just mark as approved)
    submission.status = "approved"
    submission.approved_at = datetime.now(tz.utc)

    # Send approval email to vendor
    await send_submission_email(
        submission_id=str(submission.id),
        vendor_email=submission.vendor.email if submission.vendor else "",
        status="approved",
    )

    await session.commit()
    await session.refresh(submission)

    return SubmissionRead.from_orm(submission)


@router.post("/admin/submissions/{submission_id}/reject", response_model=SubmissionRead)
async def reject_submission(
    submission_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(require_role(["admin"])),
) -> SubmissionRead:
    """Reject a vendor submission."""

    result = await session.execute(
        select(ToolSubmissionModel).where(ToolSubmissionModel.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    submission.status = "rejected"
    from datetime import timezone as tz
    submission.rejected_at = datetime.now(tz.utc)

    # Send rejection email to vendor
    await send_submission_email(
        submission_id=str(submission.id),
        vendor_email=submission.vendor.email if submission.vendor else "",
        status="rejected",
    )

    await session.commit()
    await session.refresh(submission)

    return SubmissionRead.from_orm(submission)


@router.post("/outbound/{tool_id}", response_model=OutboundClickRead)
async def record_outbound_click(
    tool_id: str,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> OutboundClickRead:
    """Record an outbound click and redirect to the tool's affiliate link."""

    from uuid import UUID as UUIDType

    try:
        tool_uuid = UUIDType(tool_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tool ID format",
        )

    # Find the tool and its affiliate link
    result = await session.execute(
        select(ToolModel).where(ToolModel.id == tool_uuid)
    )
    tool = result.scalar_one_or_none()
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found",
        )

    # Find affiliate link
    result = await session.execute(
        select(AffiliateLinkModel).where(AffiliateLinkModel.tool_id == tool_uuid)
    )
    affiliate_link = result.scalar_one_or_none()

    if not affiliate_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No affiliate link found for this tool",
        )

    if not is_safe_outbound_url(affiliate_link.provider_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Affiliate link is not a safe redirect target",
        )

    # Record the click
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    click = OutboundClickModel(
        tool_id=tool_uuid,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    session.add(click)
    await session.commit()
    await session.refresh(click)

    # Return the redirect URL
    return OutboundClickRead(
        click_id=str(click.id),
        redirect_url=affiliate_link.provider_url,
    )


@router.post("/webhooks/tiun")
async def tiun_webhook(
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Receive Tiun Business webhook events for payment processing.

    Handles idempotent event processing - returns 200 OK immediately if already processed.
    """
    from src.core.security import verify_tiun_signature

    # Get raw body and signature
    body = await request.body()
    signature = request.headers.get("Tiun-Signature")

    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Tiun signature header",
        )

    # Verify signature
    if not verify_tiun_signature(body, signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Tiun signature",
        )

    # Parse the event
    import json
    event = json.loads(body)
    event_type = event.get("type", "")
    provider_event_id = event.get("provider_event_id", "")

    # Check for idempotency - if already processed, return 200 OK
    result = await session.execute(
        select(PaymentEventModel).where(
            PaymentEventModel.provider == "tiun",
            PaymentEventModel.provider_event_id == provider_event_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"status": "already_processed", "event_id": provider_event_id}

    # Create new payment event
    payment_event = PaymentEventModel(
        provider="tiun",
        provider_event_id=provider_event_id,
        event_type=event_type,
        event_metadata=(
            json.dumps(event.get("metadata")) if event.get("metadata") else None
        ),
    )
    session.add(payment_event)
    await session.commit()
    await session.refresh(payment_event)

    # Process based on event type
    if event_type == "subscription_created":
        # Create or update subscription
        subscription_id = event.get("data", {}).get("subscription_id")
        if subscription_id:
            # Find or create subscription
            sub_result = await session.execute(
                select(SubscriptionModel).where(
                    SubscriptionModel.provider_subscription_id == subscription_id
                )
            )
            subscription = sub_result.scalar_one_or_none()
            if not subscription:
                subscription = SubscriptionModel(
                    provider_subscription_id=subscription_id,
                    user_id=event.get("data", {}).get("user_id", ""),
                    status="active",
                )
                session.add(subscription)

            subscription.status = "active"
            subscription.updated_at = datetime.now()

    elif event_type == "subscription_updated":
        # Update existing subscription status
        subscription_id = event.get("data", {}).get("subscription_id")
        if subscription_id:
            sub_result = await session.execute(
                select(SubscriptionModel).where(
                    SubscriptionModel.provider_subscription_id == subscription_id
                )
            )
            subscription = sub_result.scalar_one_or_none()
            if subscription:
                subscription.status = event.get("data", {}).get("status", "active")
                subscription.updated_at = datetime.now()

    elif event_type == "subscription_cancelled":
        # Cancel subscription
        subscription_id = event.get("data", {}).get("subscription_id")
        if subscription_id:
            sub_result = await session.execute(
                select(SubscriptionModel).where(
                    SubscriptionModel.provider_subscription_id == subscription_id
                )
            )
            subscription = sub_result.scalar_one_or_none()
            if subscription:
                subscription.status = "cancelled"
                subscription.updated_at = datetime.now()

    await session.commit()

    return {"status": "processed", "event_id": provider_event_id}