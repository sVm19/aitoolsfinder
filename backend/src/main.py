import time
import uuid
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded

from src.core.config import settings
from src.core.logging import setup_logging, request_id_ctx
from src.core.ratelimit import limiter
from src.common.exceptions import AppError
from src.common.schemas import ErrorResponse, ErrorDetail
from src.modules.operations.router import router as operations_router
from src.modules.catalog.router import (
    router as catalog_router,
    admin_router as catalog_admin_router,
)
from src.modules.intelligence.router import router as intelligence_router
from src.modules.ai.router import router as ai_router
from src.modules.identity.router import router as identity_router
from src.modules.vendor.router import router as vendor_router

setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger("aitoolsfinder.api")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info(
        f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode for {settings.OFFICIAL_DOMAIN}"
    )
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


def create_application() -> FastAPI:
    app = FastAPI(
        title="AIToolsFinder API",
        description="Core Intelligence and Catalog API for https://aitoolsfinder.cloud",
        version="1.0.0",
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url="/redoc" if settings.APP_ENV != "production" else None,
        openapi_url="/openapi.json" if settings.APP_ENV != "production" else None,
        lifespan=lifespan,
    )

    # 1. CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # 2. Correlation ID & Performance Middleware
    @app.middleware("http")
    async def request_context_middleware(request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = request_id_ctx.set(req_id)
        start_time = time.perf_counter()

        response = await call_next(request)

        duration = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Response-Time-Ms"] = f"{duration:.2f}"

        logger.info(
            f"{request.method} {request.url.path} completed with {response.status_code} in {duration:.2f}ms"
        )
        request_id_ctx.reset(token)
        return response

    # 3. Security Headers Middleware
    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # 4. Exception Handlers
    app.state.limiter = limiter

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        req_id = request_id_ctx.get() or "none"
        logger.warning(f"Rate limit exceeded on {request.url.path}")
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content=ErrorResponse(
                error=ErrorDetail(
                    code="RATE_LIMITED",
                    message="Too many requests. Please try again shortly.",
                    request_id=req_id,
                )
            ).model_dump(),
            headers={"Retry-After": "60"},
        )

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        req_id = request_id_ctx.get() or "none"
        logger.warning(f"AppError [{exc.code}]: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                error=ErrorDetail(code=exc.code, message=exc.message, request_id=req_id)
            ).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        req_id = request_id_ctx.get() or "none"
        logger.warning(f"ValidationError: {exc.errors()}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ErrorResponse(
                error=ErrorDetail(
                    code="VALIDATION_ERROR",
                    message="Request data validation failed.",
                    request_id=req_id,
                )
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        req_id = request_id_ctx.get() or "none"
        logger.exception(
            f"Unhandled exception on {request.method} {request.url.path}: {exc}"
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                error=ErrorDetail(
                    code="INTERNAL_SERVER_ERROR",
                    message="An unexpected server error occurred.",
                    request_id=req_id,
                )
            ).model_dump(),
        )

    # 5. Route Registration
    # Core API v1 router
    app.include_router(operations_router, prefix="/api/v1")
    app.include_router(catalog_router, prefix="/api/v1")
    app.include_router(intelligence_router, prefix="/api/v1")
    app.include_router(catalog_admin_router, prefix="/api/v1")
    app.include_router(ai_router, prefix="/api/v1")
    app.include_router(identity_router)
    app.include_router(vendor_router)

    # Root endpoint
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": "1.0.0",
            "domain": settings.OFFICIAL_DOMAIN,
            "documentation": f"{settings.OFFICIAL_DOMAIN}/docs"
            if settings.APP_ENV == "development"
            else "private",
            "status": "operational",
        }

    return app


app = create_application()
