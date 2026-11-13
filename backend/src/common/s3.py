"""AWS S3 & CloudFront media storage engine with presigned upload URLs."""

import logging
import os
import uuid
from typing import Dict, Any, Optional

from src.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/gif": "gif",
}

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def get_s3_client():
    """Lazily initialize boto3 S3 client using EC2 IAM Role or environment credentials."""
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION or "ap-southeast-2",
        config=Config(signature_version="s3v4"),
    )


def generate_presigned_upload(
    content_type: str,
    folder: str = "logos",
    file_prefix: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate a 5-minute AWS S3 presigned PUT URL for direct browser-to-S3 upload.

    Returns:
        upload_url: The presigned URL where browser issues PUT request.
        object_key: The storage key inside the bucket (e.g. 'logos/abc1234.png').
        public_url: The public CDN URL via CloudFront (e.g. 'https://cdn.aitoolsfinder.cloud/logos/abc1234.png').
    """
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(
            f"Unsupported content type '{content_type}'. Allowed: {', '.join(ALLOWED_CONTENT_TYPES.keys())}"
        )

    ext = ALLOWED_CONTENT_TYPES[content_type]
    prefix = f"{file_prefix}-" if file_prefix else ""
    object_key = f"{folder}/{prefix}{uuid.uuid4().hex[:16]}.{ext}"

    bucket_name = settings.S3_BUCKET_NAME or "aitoolsfinder-media"
    cdn_domain = (
        getattr(settings, "MEDIA_CDN_DOMAIN", None)
        or settings.CLOUDFRONT_DOMAIN
        or "cdn.aitoolsfinder.cloud"
    ).rstrip("/")

    # Check if AWS credentials exist or if local mock fallback is needed
    try:
        s3 = get_s3_client()
        upload_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": bucket_name,
                "Key": object_key,
                "ContentType": content_type,
            },
            ExpiresIn=300,  # 5 minutes
        )
    except Exception as e:
        logger.warning(f"Could not generate S3 presigned URL ({e}), using mock/direct upload URL")
        upload_url = f"/api/v1/media/direct-upload?key={object_key}&content_type={content_type}"

    public_url = f"https://{cdn_domain}/{object_key}"

    return {
        "upload_url": upload_url,
        "object_key": object_key,
        "public_url": public_url,
        "max_size_bytes": MAX_FILE_SIZE_BYTES,
    }
