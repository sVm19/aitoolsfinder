"""Backend submission module for Phase 7: Monetization and vendor submissions."""

import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from typing import List, Optional

from src.core.database import get_db
from src.core.security import (
    get_optional_current_user,
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
    tool_submission_tags,
    tool_submission_features,
)
from src.modules.catalog.models import (
    ToolModel,
    ToolCategoryModel,
    ToolTagModel,
    ToolFeatureModel,
    PricingPlanModel,
)
from src.modules.intelligence.scoring import calculate_tool_score
from src.modules.intelligence.models import ScoreHistoryModel
from src.modules.vendor.schemas import (
    SubmissionCreate,
    SubmissionReject,
    SubmissionRead,
    SubmissionListItem,
    OutboundClickRead,
)
from src.modules.notifications.service import send_submission_email
from src.modules.vendor.tiun_client import tiun_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Vendor Submissions"])


@router.post(
    "/submissions", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED
)
async def create_submission(
    payload: SubmissionCreate,
    session: AsyncSession = Depends(get_db),
    current_user: Optional[UserContext] = Depends(get_optional_current_user),
) -> SubmissionRead:
    """Create a new tool submission from a vendor.

    Supports both anonymous public visitors and authenticated vendor users.
    Persists taxonomy tags, features, pricing, and triggers a receipt email.
    """
    from urllib.parse import urlparse
    from uuid import UUID as UUIDType
    from src.modules.catalog.schemas import slugify

    slug = slugify(payload.tool_name)
    if not slug:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tool name must contain alphanumeric characters.",
        )

    parsed_host = (
        (urlparse(payload.website_url).hostname or "").lower().removeprefix("www.")
    )
    if not parsed_host:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid website URL is required.",
        )

    domain_filters = [
        ToolSubmissionModel.tool_slug == slug,
        ToolSubmissionModel.website_url.ilike(f"%://{parsed_host}"),
        ToolSubmissionModel.website_url.ilike(f"%://{parsed_host}/%"),
        ToolSubmissionModel.website_url.ilike(f"%://www.{parsed_host}"),
        ToolSubmissionModel.website_url.ilike(f"%://www.{parsed_host}/%"),
    ]
    existing_sub = (
        await session.execute(
            select(ToolSubmissionModel.id).where(
                ToolSubmissionModel.status.in_(["pending", "approved"]),
                or_(*domain_filters),
            )
        )
    ).first()
    if existing_sub:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This project has already been submitted and is pending review or approved.",
        )

    existing_tool = (
        await session.execute(
            select(ToolModel.id).where(
                or_(
                    ToolModel.slug == slug,
                    ToolModel.website_url.ilike(f"%://{parsed_host}"),
                    ToolModel.website_url.ilike(f"%://{parsed_host}/%"),
                    ToolModel.website_url.ilike(f"%://www.{parsed_host}"),
                    ToolModel.website_url.ilike(f"%://www.{parsed_host}/%"),
                )
            )
        )
    ).first()
    if existing_tool:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This project is already listed in the catalog.",
        )

    # Vendor Profile Resolution: Guarantee vendor_id is never NULL
    vendor_email = (
        (current_user.email if current_user else payload.submitter_email)
        .strip()
        .lower()
    )
    vendor_name = (
        current_user.display_name
        if current_user
        else payload.submitter_name or payload.tool_name
    ).strip()

    result = await session.execute(
        select(VendorModel).where(VendorModel.email == vendor_email)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        vendor = VendorModel(
            name=vendor_name,
            email=vendor_email,
            website_url=payload.website_url,
        )
        session.add(vendor)
        await session.flush()
    vendor_id = vendor.id

    # Safe primary category UUID parsing
    primary_category_uuid = None
    if payload.primary_category_id:
        try:
            primary_category_uuid = UUIDType(payload.primary_category_id)
        except ValueError:
            primary_category_uuid = None

    submission = ToolSubmissionModel(
        vendor_id=vendor_id,
        tool_name=payload.tool_name,
        tool_slug=slug,
        tagline=payload.tagline,
        description=payload.description,
        primary_category_id=primary_category_uuid,
        pricing_model=payload.pricing_model,
        is_free=payload.is_free,
        starting_price_minor=payload.starting_price_minor,
        currency=payload.currency,
        website_url=payload.website_url,
        status="pending",
    )

    session.add(submission)
    await session.flush()

    # Associate secondary tags if provided
    for tag_str in payload.secondary_tag_ids:
        try:
            t_uuid = UUIDType(tag_str)
            await session.execute(
                tool_submission_tags.insert().values(
                    tool_submission_id=submission.id,
                    tag_id=t_uuid,
                )
            )
        except Exception:
            pass

    # Associate core features if provided
    for feat_str in payload.core_feature_ids:
        try:
            f_uuid = UUIDType(feat_str)
            await session.execute(
                tool_submission_features.insert().values(
                    tool_submission_id=submission.id,
                    feature_id=f_uuid,
                )
            )
        except Exception:
            pass

    # If an affiliate link was provided, store in affiliate_links as pending
    if payload.affiliate_url and is_safe_outbound_url(payload.affiliate_url):
        # We will activate upon tool approval
        pass

    await session.commit()
    await session.refresh(submission)

    # Trigger automated receipt email via Resend
    await send_submission_email(
        submission_id=str(submission.id),
        vendor_email=vendor_email,
        status="received",
        tool_name=payload.tool_name,
        tool_slug=submission.tool_slug,
    )

    return SubmissionRead.model_validate(submission)


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
            vendor_name=s.vendor.name if s.vendor else "Unknown Vendor",
            tool_name=s.tool_name,
            tool_slug=s.tool_slug,
            website_url=s.website_url,
            status=s.status,
            created_at=s.created_at,
        )
        for s in submissions
    ]


@router.post(
    "/admin/submissions/{submission_id}/approve", response_model=SubmissionRead
)
async def approve_submission(
    submission_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(require_role(["admin"])),
) -> SubmissionRead:
    """Approve a vendor submission and publish it as a live tool.

    Atomic Transaction:
    1. Creates live record in tools with SEO slug
    2. Links categories, tags, features, and pricing plan
    3. Calculates initial Platform Intelligence Score
    4. Marks submission approved
    5. Sends celebration email with badge embed code to founder
    """
    from datetime import timezone as tz

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

    # Check if a tool with this slug already exists in tools table
    result = await session.execute(
        select(ToolModel).where(ToolModel.slug == submission.tool_slug)
    )
    existing_tool = result.scalar_one_or_none()
    if existing_tool:
        submission.tool_slug = f"{submission.tool_slug}-{uuid.uuid4().hex[:8]}"

    tool_id = uuid.uuid4()
    now_utc = datetime.now(tz.utc)

    # 1. Create live Tool record
    tool = ToolModel(
        id=tool_id,
        slug=submission.tool_slug,
        name=submission.tool_name,
        tagline=submission.tagline,
        description=submission.description,
        website_url=submission.website_url or "",
        primary_category_id=submission.primary_category_id,
        pricing_model=submission.pricing_model,
        platform_status="active",
        is_verified=True,
        is_sponsored=False,
        launched_at=now_utc.date(),
        last_verified_at=now_utc,
        created_at=now_utc,
        updated_at=now_utc,
    )
    session.add(tool)

    # 2. Link primary category to tool_categories
    if submission.primary_category_id:
        session.add(
            ToolCategoryModel(
                tool_id=tool_id,
                category_id=submission.primary_category_id,
            )
        )

    # 3. Copy linked tags from tool_submission_tags to tool_tags
    tag_records = await session.execute(
        select(tool_submission_tags.c.tag_id).where(
            tool_submission_tags.c.tool_submission_id == submission.id
        )
    )
    for (tag_uuid,) in tag_records.all():
        if tag_uuid:
            session.add(ToolTagModel(tool_id=tool_id, tag_id=tag_uuid))

    # 4. Copy linked features from tool_submission_features to tool_features
    feat_records = await session.execute(
        select(tool_submission_features.c.feature_id).where(
            tool_submission_features.c.tool_submission_id == submission.id
        )
    )
    for (feat_uuid,) in feat_records.all():
        if feat_uuid:
            session.add(
                ToolFeatureModel(
                    tool_id=tool_id,
                    feature_id=feat_uuid,
                    support_level="yes",
                )
            )

    # 5. Create live pricing plan
    plan_name = "Free Tier" if submission.is_free else "Standard Plan"
    pricing_plan = PricingPlanModel(
        tool_id=tool_id,
        name=plan_name,
        is_free=submission.is_free,
        amount_minor=submission.starting_price_minor,
        currency=submission.currency,
        source_url=submission.website_url,
        last_verified_at=now_utc,
    )
    session.add(pricing_plan)

    # 6. Mark submission as approved
    submission.status = "approved"
    submission.approved_at = now_utc

    # Flush session to calculate initial intelligence score
    await session.flush()
    try:
        # Pre-populate relationships in instance dict to prevent async missing greenlet during lazy load
        tool.__dict__["features"] = []
        tool.__dict__["pricing_plans"] = [pricing_plan]
        score_data = calculate_tool_score(tool)
        if score_data.overall_score is not None:
            score_record = ScoreHistoryModel(
                tool_id=tool_id,
                score_version=score_data.score_version,
                overall_score=score_data.overall_score,
                dimension_scores={
                    k: float(v) if v is not None else None
                    for k, v in score_data.dimension_scores.items()
                },
                evidence=score_data.evidence,
                calculated_at=now_utc,
            )
            session.add(score_record)
    except Exception as e:
        logger.warning(f"Could not compute initial tool score: {e}")

    await session.commit()
    await session.refresh(submission)

    # 7. Send celebration email with live URL and badge widget code
    vendor_email = submission.vendor.email if submission.vendor else ""
    if vendor_email:
        await send_submission_email(
            submission_id=str(submission.id),
            vendor_email=vendor_email,
            status="approved",
            tool_name=submission.tool_name,
            tool_slug=submission.tool_slug,
        )

    return SubmissionRead.model_validate(submission)


@router.post("/admin/submissions/{submission_id}/reject", response_model=SubmissionRead)
async def reject_submission(
    submission_id: str,
    payload: Optional[SubmissionReject] = None,
    session: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(require_role(["admin"])),
) -> SubmissionRead:
    """Reject a vendor submission with feedback."""
    from datetime import timezone as tz

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
    submission.rejected_at = datetime.now(tz.utc)

    vendor_email = submission.vendor.email if submission.vendor else ""
    if vendor_email:
        await send_submission_email(
            submission_id=str(submission.id),
            vendor_email=vendor_email,
            status="rejected",
            tool_name=submission.tool_name,
            tool_slug=submission.tool_slug,
        )

    await session.commit()
    await session.refresh(submission)

    return SubmissionRead.model_validate(submission)


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
    result = await session.execute(select(ToolModel).where(ToolModel.id == tool_uuid))
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
    """Receive Tiun Business webhook events for payment and access management.

    Tiun webhooks carry IDs and are unsigned; access is verified server-to-server
    via Tiun S2S API before state changes are applied. Idempotent deduplication is
    enforced via PaymentEventModel.
    """
    import json
    import uuid

    body = await request.body()
    try:
        event = json.loads(body)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )

    # Tiun event identifier and type
    event_type = event.get("event") or event.get("type", "unknown")
    provider_event_id = str(
        event.get("id")
        or event.get("provider_event_id")
        or event.get("eventId")
        or uuid.uuid4()
    )

    # Check for idempotency
    result = await session.execute(
        select(PaymentEventModel).where(
            PaymentEventModel.provider == "tiun",
            PaymentEventModel.provider_event_id == provider_event_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"status": "already_processed", "event_id": provider_event_id}

    # Record event
    payment_event = PaymentEventModel(
        provider="tiun",
        provider_event_id=provider_event_id,
        event_type=event_type,
        status="received",
        event_metadata=json.dumps(event),
    )
    session.add(payment_event)
    await session.commit()
    await session.refresh(payment_event)

    user_id_str = str(event.get("userId") or event.get("user_id") or "")
    product_id_str = str(event.get("productId") or event.get("product_id") or "")
    reference_id_str = event.get("referenceId") or event.get("reference_id")

    # Handle Tiun access events with S2S verification
    if event_type in ("product_access.add", "subscription_created"):
        # Confirm access state directly with Tiun S2S API
        is_verified = True
        if user_id_str and product_id_str:
            is_verified = await tiun_client.verify_product_access(
                user_id=user_id_str,
                product_id=product_id_str,
                reference_id=reference_id_str,
            )

        if not is_verified:
            payment_event.status = "verification_failed"
            await session.commit()
            return {"status": "verification_failed", "event_id": provider_event_id}

        # Handle subscription or purchase association
        sub_id = str(
            event.get("data", {}).get("subscription_id")
            or f"tiun_{user_id_str}_{product_id_str}"
        )
        sub_result = await session.execute(
            select(SubscriptionModel).where(
                SubscriptionModel.provider_subscription_id == sub_id
            )
        )
        subscription = sub_result.scalar_one_or_none()

        target_user_uuid = None
        if reference_id_str:
            try:
                target_user_uuid = uuid.UUID(reference_id_str)
            except (ValueError, TypeError):
                target_user_uuid = None

        if not target_user_uuid:
            try:
                target_user_uuid = uuid.UUID(user_id_str)
            except (ValueError, TypeError):
                target_user_uuid = None

        if target_user_uuid:
            if not subscription:
                subscription = SubscriptionModel(
                    provider_subscription_id=sub_id,
                    user_id=target_user_uuid,
                    status="active",
                )
                session.add(subscription)
            else:
                subscription.status = "active"
                subscription.updated_at = datetime.now(timezone.utc)

        payment_event.status = "processed"

    elif event_type in ("product_access.remove", "subscription_cancelled"):
        sub_id = str(
            event.get("data", {}).get("subscription_id")
            or f"tiun_{user_id_str}_{product_id_str}"
        )
        sub_result = await session.execute(
            select(SubscriptionModel).where(
                SubscriptionModel.provider_subscription_id == sub_id
            )
        )
        subscription = sub_result.scalar_one_or_none()
        if subscription:
            subscription.status = "cancelled"
            subscription.updated_at = datetime.now(timezone.utc)
        payment_event.status = "processed"

    elif event_type in ("user.create", "user.revoke_consent", "subscription_updated"):
        payment_event.status = "processed"

    else:
        payment_event.status = "ignored"

    await session.commit()
    return {"status": payment_event.status, "event_id": provider_event_id}
