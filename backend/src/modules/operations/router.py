from fastapi import APIRouter, status, Response
from src.core.config import settings
from src.core.database import check_database_health
from src.modules.operations.schemas import HealthResponse, ReadinessResponse

router = APIRouter(prefix="/health", tags=["Health & Operations"])


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
