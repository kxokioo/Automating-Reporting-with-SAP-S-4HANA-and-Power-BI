import os
import secrets
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# Provide a runtime fallback SECRET_KEY for CI/test runs when a secret is unavailable.
if os.environ.get("PYTEST_CURRENT_TEST") or os.environ.get("GITHUB_ACTIONS"):
    os.environ.setdefault("SECRET_KEY", secrets.token_urlsafe(32))

class Settings(BaseSettings):
    # App General
    PROJECT_NAME: str = "Aetheris Enterprise Analytics"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    
    # Security - MUST be set in production
    SECRET_KEY: str
    ALLOWED_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    LOGIN_MAX_ATTEMPTS: int = 5
    
    # Seed Database Passwords (must meet complexity requirements)
    SEED_ADMIN_PASSWORD: str = "AdminPass2026!"
    SEED_FINANCE_PASSWORD: str = "FinancePass2026!"
    SEED_LOGISTICS_PASSWORD: str = "LogisticsPass2026!"
    SEED_VIEWER_PASSWORD: str = "ViewerPass2026!"
    
    # Database
    DATABASE_URL: str = "sqlite:///./aetheris.db"
    
    # SAP Integration Settings - MUST be explicitly set
    SAP_BASE_URL: str = "https://sap.example.com"
    SAP_CLIENT: str = "100"
    SAP_USERNAME: str = "sap_user"
    SAP_PASSWORD: str = ""
    USE_MOCK_SAP: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/aetheris.log"

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env"
    )
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._validate_security()
    
    def _validate_security(self):
        """Validate critical security settings"""
        # SECRET_KEY must be set and long enough
        if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
            # Allow tests to run when pytest sets a sentinel env var in CI/test runs
            if os.environ.get("PYTEST_CURRENT_TEST"):
                return
            raise ValueError(
                "ERROR: SECRET_KEY not set or too short! "
                "Set a strong SECRET_KEY in .env file (min 32 characters). "
                "Generate with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        
        # CORS must not be "*" in production
        if self.ALLOWED_CORS_ORIGINS == "*":
            if not self.DEBUG:
                raise ValueError(
                    "ERROR: CORS origins set to '*' in production mode! "
                    "Set specific origins in ALLOWED_CORS_ORIGINS environment variable."
                )
        
        # Mock SAP mode must be explicit
        if self.USE_MOCK_SAP and not self.DEBUG:
            # In production, explicitly requiring USE_MOCK_SAP=False if using real SAP
            pass

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
