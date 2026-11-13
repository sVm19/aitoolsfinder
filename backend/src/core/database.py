from typing import Any, AsyncGenerator, Dict
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from src.core.config import settings


class Base(DeclarativeBase):
    pass


connect_args: Dict[str, Any] = {}
use_supabase = settings.ENABLE_SUPABASE

if use_supabase:
    # Supabase requires SSL connection with self-signed pooler cert support
    import ssl
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_ctx
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=(settings.APP_ENV == "development" and settings.LOG_LEVEL == "DEBUG"),
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        connect_args=connect_args,
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=(settings.APP_ENV == "development" and settings.LOG_LEVEL == "DEBUG"),
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        connect_args=connect_args,
)


async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def check_database_health() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False