import logging
from fastapi import APIRouter, status, Response, HTTPException
from src.core.config import settings
from src.core.database import check_database_health
from src.modules.operations.schemas import (
    HealthResponse,
    ReadinessResponse,
    NewsletterSubscribeRequest,
    NewsletterSubscribeResponse,
)
from src.modules.notifications.service import send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["Health & Operations"])
newsletter_router = APIRouter(prefix="/newsletter", tags=["Newsletter"])


@router.get("/live", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_live() -> HealthResponse:
    return HealthResponse(
        status="ok", app=settings.APP_NAME, environment=settings.APP_ENV
    )


@router.get("/ready", response_model=ReadinessResponse)
async def health_ready(response: Response) -> ReadinessResponse:
    db_healthy = await check_database_health()
    if not db_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadinessResponse(
            status="unhealthy",
            database="disconnected",
            app=settings.APP_NAME,
            environment=settings.APP_ENV,
        )

    return ReadinessResponse(
        status="ready",
        database="connected",
        app=settings.APP_NAME,
        environment=settings.APP_ENV,
    )


@newsletter_router.post(
    "/subscribe",
    response_model=NewsletterSubscribeResponse,
    status_code=status.HTTP_200_OK,
)
async def subscribe_newsletter(
    payload: NewsletterSubscribeRequest,
) -> NewsletterSubscribeResponse:
    email = payload.email.strip().lower()
    if not email or "@" not in email or "." not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required.",
        )

    logger.info(f"[Newsletter subscriber] {email}")

    # Send confirmation welcome email if email credentials are configured
    try:
        subject = "Welcome to Tuesday AI Drop & Pricing Arbitrage"
        html = """
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1722;">
            <h1 style="color: #7022fc; margin-bottom: 16px;">You're on the list! 🎉</h1>
            <p style="font-size: 16px; line-height: 1.6;">Welcome to the <strong>Tuesday AI Drop</strong> by AIToolsFinder.cloud.</p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">Every Tuesday, we deliver 5 verified AI tools, sneak plan price adjustments, and founder teardowns with zero marketing fluff.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 13px; color: #888;">AIToolsFinder.cloud · The Ground-Truth AI Intelligence Directory</p>
        </div>
        """
        await send_email(email, subject, html)
    except Exception as exc:
        logger.warning(f"[Newsletter welcome email skipped] {exc}")

    return NewsletterSubscribeResponse(
        status="subscribed",
        message="You're subscribed! You'll receive our Tuesday AI Drop & Pricing Arbitrage digest.",
    )
