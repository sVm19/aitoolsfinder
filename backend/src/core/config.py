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

    # Database Configuration
    # When SUPABASE_URL is set, DATABASE_URL and DATABASE_URL_SYNC will auto-configure
    # to use Supabase PostgreSQL with SSL required.
    # Otherwise, falls back to local PostgreSQL as before.
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/aitoolsfinder"
    )
    DATABASE_URL_SYNC: str = (
        "postgresql://postgres:postgres@localhost:5432/aitoolsfinder"
    )
    DB_SSL_MODE: Optional[str] = None  # Set to "require" when connecting to Supabase

    # Supabase Specific Keys
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
    S3_BUCKET_NAME: str = "aitoolsfinder-media"
    CLOUDFRONT_DOMAIN: str = "cdn.aitoolsfinder.cloud"

    # AI & Integrations
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "anthropic/claude-3.5-sonnet"
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "meta-llama/llama3-8b-8192"
    OPENROUTER_TIMEOUT_SECONDS: float = 10.0
    OPENROUTER_MAX_RETRIES: int = 2
    TIUN_API_KEY: Optional[str] = None
    TIUN_WEBHOOK_SECRET: Optional[str] = None
    RESEND_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "notifications@aitoolsfinder.cloud"
    POSTHOG_API_KEY: Optional[str] = None
    POSTHOG_HOST: str = "https://app.posthog.com"

    # Feature Flags
    ENABLE_SUPABASE: bool = False
    ENABLE_COGNITO: bool = True


settings = Settings()

# Auto-configure Supabase flags when SUPABASE_URL is provided
if settings.SUPABASE_URL:
    settings.ENABLE_SUPABASE = True
    if not settings.DB_SSL_MODE:
        settings.DB_SSL_MODE = "require"