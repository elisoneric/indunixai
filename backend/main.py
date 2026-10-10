import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.database import init_db, AsyncSessionLocal
from backend.core.redis import redis_manager
from backend.routers import (
    auth,
    gateway,
    keys,
    billing,
    analytics,
    enterprise,
    telemetry,
    admin
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("indunix")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Indunix Sovereign Infrastructure...")
    await init_db()
    await redis_manager.init()

    # Load dynamic SMTP settings from database into email_service
    try:
        from backend.models.system_setting import SystemSetting
        from backend.services.email_service import email_service
        async with AsyncSessionLocal() as session:
            smtp_setting = await session.get(SystemSetting, "smtp_settings")
            if smtp_setting and smtp_setting.value_json:
                email_service.update_config(smtp_setting.value_json)
                logger.info("Loaded custom SMTP mail server configuration from database.")
    except Exception as e:
        logger.warning(f"Could not load custom SMTP configuration on startup: {e}")

    yield
    logger.info("Shutting down Indunix Gateway...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Indunix AI Sovereign API Gateway & Enterprise Telemetry Engine (Direct Naira Settlements)",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gateway and Service Routers
app.include_router(gateway.router)
app.include_router(auth.router)
app.include_router(keys.router)
app.include_router(billing.router)
app.include_router(analytics.router)
app.include_router(enterprise.router)
app.include_router(telemetry.router)
app.include_router(admin.router)

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "indunix-gateway",
        "version": settings.VERSION,
        "naira_native": True
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "platform": "Indunix AI Sovereign Infrastructure",
        "documentation": "https://indunixai.com/docs",
        "gateway_endpoint": "https://api.indunixai.com/v1",
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
