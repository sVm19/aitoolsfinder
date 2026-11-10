from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # General App Settings
    APP_NAME: str = "AIToolsFinder API"
    APP_ENV: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "INFO"
    APP_SECRET_KEY: str = "development-secret-key-replace-in-production-min-32-chars"
    OFFICIAL_DOMAIN: str = "https://aitoolsfinder.cloud"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://aitoolsfinder.cloud"]

    # Database (Supabase PostgreSQL / Local PostgreSQL)
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/aitoolsfinder"
    )
    DATABASE_URL_SYNC: str = (
        "postgresql://postgres:postgres@localhost:5432/aitoolsfinder"
    )
    DB_SSL_MODE: Optional[str] = None  # Set to "require" when connecting to Supabase

    # Supabase Specific Keys (Optional API usage)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # AWS Cognito
    COGNITO_REGION: str = "us-east-1"
    COGNITO_USER_POOL_ID: Optional[str] = None
    COGNITO_APP_CLIENT_ID: Optional[str] = None
    COGNITO_DOMAIN: Optional[str] = None

    # AWS S3 & CloudFront
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: Optional[str] = "aitoolsfinder-media"
    CLOUDFRONT_DOMAIN: Optional[str] = "cdn.aitoolsfinder.cloud"

    # AI & Integrations
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "anthropic/claude-3.5-sonnet"
    TIUN_API_KEY: Optional[str] = None
    TIUN_WEBHOOK_SECRET: Optional[str] = None
    RESEND_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "notifications@aitoolsfinder.cloud"
    POSTHOG_API_KEY: Optional[str] = None
    POSTHOG_HOST: str = "https://app.posthog.com"


settings = Settings()
