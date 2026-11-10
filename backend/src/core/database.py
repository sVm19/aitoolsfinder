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
if settings.DB_SSL_MODE:
    connect_args["ssl"] = settings.DB_SSL_MODE

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
