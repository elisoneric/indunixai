from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from backend.core.config import settings

# Engine configuration supporting SQLite (aiosqlite) and PostgreSQL (asyncpg)
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    import asyncio
    import logging
    logger = logging.getLogger("indunix.db")
    global engine, AsyncSessionLocal

    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database initialized successfully.")
            return
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                await asyncio.sleep(1.5)

    # If Postgres failed, switch to SQLite fallback engine so backend NEVER crashes
    try:
        logger.warning("Primary database connection failed. Falling back to local SQLite engine to maintain uptime...")
        sqlite_engine = create_async_engine(
            "sqlite+aiosqlite:///./indunix.db",
            echo=False,
            connect_args={"check_same_thread": False},
            future=True
        )
        async with sqlite_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        engine = sqlite_engine
        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False
        )
        logger.info("Local fallback database initialized successfully.")
    except Exception as fallback_err:
        logger.error(f"Critical: Database fallback initialization failed: {fallback_err}")
