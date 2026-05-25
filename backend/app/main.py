import uvicorn
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import engine, Base, SessionLocal
from app.database.models import User, SapConnection, EtlPipeline
from app.routers import auth, api
from app.routers.auth import get_password_hash
from app.services.etl_engine import EtlOrchestrator
from app.middleware import RateLimitMiddleware, ErrorHandlingMiddleware, LoggingMiddleware

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Aetheris Enterprise Analytics & Reporting Platform with SAP S/4HANA, BW/4HANA, and Power BI",
    version="1.0.0"
)

# ============================================
# MIDDLEWARE CONFIGURATION
# ============================================
# Order matters: inner middlewares are executed first
app.add_middleware(LoggingMiddleware)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)

# ============================================
# CORS Configuration - CRITICAL SECURITY FIX
# ============================================
origins = [o.strip() for o in settings.ALLOWED_CORS_ORIGINS.split(",") if o.strip()]

if not origins:
    logger.warning("ALLOWED_CORS_ORIGINS not configured - defaulting to localhost only")
    origins = ["http://localhost:3000", "http://localhost:5173"]

if "*" in origins and not settings.DEBUG:
    logger.error("CRITICAL: CORS configured with wildcard (*) in production mode!")
    raise ValueError("CORS wildcard not allowed in production. Set specific origins in ALLOWED_CORS_ORIGINS.")

logger.info(f"CORS Origins configured: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(api.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "Online",
        "system": "Aetheris Enterprise Gateway",
        "version": "2026.1.0",
        "sap_connector": "Connected" if not settings.USE_MOCK_SAP else "Mock Mode",
        "powerbi_gateway": "Active"
    }

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "database": "connected",
        "mock_mode": settings.USE_MOCK_SAP
    }

def seed_database():
    """
    Automated seed procedure to ensure instant out-of-the-box operation.
    WARNING: This creates weak default users for development/testing ONLY.
    In production, create users through proper admin interface.
    """
    db = SessionLocal()
    try:
        # 1. Create Tables
        Base.metadata.create_all(bind=engine)

        # 2. Seed Default Users (DEVELOPMENT ONLY - Weak credentials for testing)
        if db.query(User).count() == 0:
            logger.info("[Database Seed] Seeding enterprise users for development...")
            
            # WARNING: These are weak credentials for development/testing ONLY
            if settings.DEBUG:
                logger.warning("[SECURITY WARNING] Using weak default passwords - for DEVELOPMENT ONLY!")
                users = [
                    User(username="admin", hashed_password=get_password_hash("admin123"), role="Admin"),
                    User(username="finance", hashed_password=get_password_hash("finance123"), role="FinancialAnalyst"),
                    User(username="logistics", hashed_password=get_password_hash("logistics123"), role="LogisticsManager"),
                    User(username="viewer", hashed_password=get_password_hash("viewer123"), role="Viewer")
                ]
                db.add_all(users)
                db.commit()
            else:
                logger.error("[SECURITY] Database seeding requires DEBUG=True or manual user creation in production")

        # 3. Seed Default SAP Connection Profiles
        if db.query(SapConnection).count() == 0:
            logger.info("[Database Seed] Seeding SAP system connection profiles...")
            connections = [
                SapConnection(
                    name="SAP S/4HANA Production Gateway",
                    system_type="S4HANA",
                    base_url="https://s4hana-prd.aetheris-internal.com:8443",
                    client="100",
                    username="AETHERIS_ETL_USER",
                    is_active=True
                ),
                SapConnection(
                    name="SAP BW/4HANA Enterprise Warehouse",
                    system_type="BW4HANA",
                    base_url="https://bw4hana-prd.aetheris-internal.com:8443",
                    client="200",
                    username="AETHERIS_BW_USER",
                    is_active=True
                )
            ]
            db.add_all(connections)
            db.commit()

        # 4. Seed Default ETL Pipelines
        if db.query(EtlPipeline).count() == 0:
            logger.info("[Database Seed] Seeding standard ETL pipelines...")
            pipelines = [
                EtlPipeline(
                    name="SAP FICO General Ledger Data Feed",
                    source_system="SAP S/4HANA OData Core",
                    target_table="financial_records",
                    schedule_cron="*/30 * * * *",
                    last_run_status="NEVER",
                    is_active=True
                ),
                EtlPipeline(
                    name="SAP MM Product Inventory Sync",
                    source_system="SAP S/4HANA OData Core",
                    target_table="logistics_records",
                    schedule_cron="0 * * * *",
                    last_run_status="NEVER",
                    is_active=True
                )
            ]
            db.add_all(pipelines)
            db.commit()
            
            # Immediately run the seed pipelines locally to prepopulate dashboards!
            if settings.USE_MOCK_SAP:
                logger.info("[Database Seed] Performing initial data loading pipelines...")
                EtlOrchestrator._execute_pipeline(1)
                EtlOrchestrator._execute_pipeline(2)

    except Exception as e:
        logger.error(f"[Database Seed Error] Initial seeding process failed: {str(e)}")
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    logger.info("Starting Aetheris Analytics Platform...")
    logger.info(f"DEBUG mode: {settings.DEBUG}")
    logger.info(f"Mock SAP mode: {settings.USE_MOCK_SAP}")
    seed_database()
    logger.info("Startup complete")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
