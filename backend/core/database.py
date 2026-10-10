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

async def _seed_admin_and_load_settings(session_factory):
    import logging
    logger = logging.getLogger("indunix.seed")
    try:
        async with session_factory() as session:
            from sqlalchemy import select
            from backend.models.user import User, UserRole
            from backend.models.wallet import Wallet
            from backend.models.system_setting import SystemSetting
            from backend.core.security import hash_password

            # Check if superadmin indunixai exists
            res = await session.execute(
                select(User).where((User.username == "indunixai") | (User.email == "admin@indunixai.com"))
            )
            admin = res.scalar_one_or_none()
            if not admin:
                admin = User(
                    username="indunixai",
                    email="admin@indunixai.com",
                    hashed_password=hash_password("Password@26"),
                    full_name="Indunix AI Administrator",
                    company_name="Indunix AI Technologies",
                    role=UserRole.SUPERADMIN,
                    must_change_password=True,
                    is_active=True
                )
                session.add(admin)
                await session.flush()

                admin_wallet = Wallet(
                    user_id=admin.id,
                    balance_ngn=50000.0,
                    bonus_credits_ngn=50000.0,
                    currency="NGN"
                )
                session.add(admin_wallet)
                await session.commit()
                logger.info("Default superadmin 'indunixai' seeded with initial password change requirement.")
            else:
                updated = False
                if not admin.username:
                    admin.username = "indunixai"
                    updated = True
                if admin.role != UserRole.SUPERADMIN:
                    admin.role = UserRole.SUPERADMIN
                    updated = True
                if updated:
                    await session.commit()

            # Load persistent pricing and promo settings
            pricing_row = await session.get(SystemSetting, "model_pricing")
            if pricing_row and pricing_row.value_json:
                for m_id, m_data in pricing_row.value_json.items():
                    if m_id in settings.RATE_CARD_NGN:
                        settings.RATE_CARD_NGN[m_id].update(m_data)
    except Exception as e:
        logger.warning(f"Error during seed/settings initialization: {e}")

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
                # Ensure new columns exist on existing tables
                from sqlalchemy import text
                for table, col, col_type in [
                    ("wallets", "dedicated_account_bank", "VARCHAR(100)"),
                    ("wallets", "dedicated_account_number", "VARCHAR(50)"),
                    ("wallets", "dedicated_account_name", "VARCHAR(200)"),
                    ("wallets", "paystack_customer_code", "VARCHAR(100)"),
                    ("users", "username", "VARCHAR(100)"),
                    ("users", "must_change_password", "BOOLEAN DEFAULT 0"),
                ]:
                    try:
                        await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                    except Exception:
                        pass

            # Seed default data and load system settings
            await _seed_admin_and_load_settings(AsyncSessionLocal)
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
        await _seed_admin_and_load_settings(AsyncSessionLocal)
    except Exception as fallback_err:
        logger.error(f"Critical: Database fallback initialization failed: {fallback_err}")
