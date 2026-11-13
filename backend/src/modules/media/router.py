"""Media upload router: S3 presigned URLs with Supabase & local storage fallbacks."""

import logging
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import BaseModel, Field

from src.common.s3 import generate_presigned_upload, ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES
from src.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/media", tags=["Media"])


class PresignedUrlRequest(BaseModel):
    content_type: str = Field(description="MIME type, e.g. image/png, image/jpeg, image/webp, image/svg+xml")
    folder: str = Field(default="logos", description="Target folder: logos | screenshots")


class PresignedUrlResponse(BaseModel):
    upload_url: str
    object_key: str
    public_url: str
    max_size_bytes: int


@router.post("/presigned-url", response_model=PresignedUrlResponse)
async def get_presigned_upload_url(payload: PresignedUrlRequest) -> PresignedUrlResponse:
    """Generate a 5-minute AWS S3 presigned upload URL for direct browser uploads."""
    if payload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type. Allowed: {list(ALLOWED_CONTENT_TYPES.keys())}",
        )
    if payload.folder not in {"logos", "screenshots"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder must be 'logos' or 'screenshots'",
        )

    try:
        result = generate_presigned_upload(
            content_type=payload.content_type,
            folder=payload.folder,
        )
        return PresignedUrlResponse(**result)
    except Exception as e:
        logger.error(f"Failed to generate presigned upload URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate upload URL",
        )


@router.put("/direct-upload")
async def direct_upload_fallback(
    request: Request,
    key: str = Query(...),
    content_type: str = Query(default="image/png"),
):
    """Fallback upload handler if S3 is in development/local mode."""
    body = await request.body()
    if len(body) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")

    # Try uploading to Supabase Storage if configured
    if settings.ENABLE_SUPABASE and settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            import httpx
            headers = {
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": content_type,
            }
            supabase_url = settings.SUPABASE_URL.rstrip("/")
            bucket = settings.S3_BUCKET_NAME or "aitoolsfinder-media"
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{supabase_url}/storage/v1/object/{bucket}/{key}",
                    headers=headers,
                    content=body,
                )
                if res.status_code in (200, 201):
                    return {"status": "uploaded", "key": key, "url": f"{supabase_url}/storage/v1/object/public/{bucket}/{key}"}
        except Exception as e:
            logger.warning(f"Supabase storage upload fallback failed: {e}")

    # Local disk fallback
    os.makedirs(os.path.join("data", "uploads", os.path.dirname(key)), exist_ok=True)
    local_path = os.path.join("data", "uploads", key)
    with open(local_path, "wb") as f:
        f.write(body)

    return {"status": "uploaded", "key": key, "url": f"/uploads/{key}"}
