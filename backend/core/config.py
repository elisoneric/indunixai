from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow",
        case_sensitive=True
    )

    PROJECT_NAME: str = "Indunix AI Sovereign Infrastructure"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/v1"
    
    # Security & JWT
    SECRET_KEY: str = Field(default="change-me-to-a-secure-random-64-character-jwt-key-2026", validation_alias="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    APP_URL: str = Field(default="https://indunixai.com", validation_alias="APP_URL")
    
    # Database
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./indunix.db", validation_alias="DATABASE_URL")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    
    # Paystack Payments (Parent merchant: Esam Creative Technologies)
    PAYSTACK_SECRET_KEY: Optional[str] = Field(default=None, validation_alias="PAYSTACK_SECRET_KEY")
    PAYSTACK_PUBLIC_KEY: Optional[str] = Field(default=None, validation_alias="PAYSTACK_PUBLIC_KEY")
    PAYSTACK_BASE_URL: str = "https://api.paystack.co"
    
    # Internal Upstream AI Providers (COMPLETELY ABSTRACTED AND NEVER EXPOSED TO CLIENTS)
    DEEPSEEK_API_KEY: Optional[str] = Field(default=None, validation_alias="DEEPSEEK_API_KEY")
    GROQ_API_KEY: Optional[str] = Field(default=None, validation_alias="GROQ_API_KEY")
    OPENAI_API_KEY: Optional[str] = Field(default=None, validation_alias="OPENAI_API_KEY")
    TOGETHER_API_KEY: Optional[str] = Field(default=None, validation_alias="TOGETHER_API_KEY")
    MOCK_UPSTREAM_IF_UNSET: bool = Field(default=False, validation_alias="MOCK_UPSTREAM_IF_UNSET")
    
    # Enterprise On-premise Telemetry Master Signing Key
    ENTERPRISE_LEASE_SIGNING_KEY: str = Field(default="indunix-edge-ent-master-sig-key-2026", validation_alias="ENTERPRISE_LEASE_SIGNING_KEY")
    
    # SMTP Email Configuration (cPanel / Roundcube Webmail compatible)
    SMTP_HOST: Optional[str] = Field(default=None, validation_alias="SMTP_HOST")
    SMTP_PORT: int = Field(default=465, validation_alias="SMTP_PORT")
    SMTP_USER: Optional[str] = Field(default=None, validation_alias="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(default=None, validation_alias="SMTP_PASSWORD")
    SMTP_FROM_EMAIL: str = Field(default="notifications@indunixai.com", validation_alias="SMTP_FROM_EMAIL")
    SMTP_FROM_NAME: str = Field(default="Indunix AI", validation_alias="SMTP_FROM_NAME")
    SMTP_USE_SSL: bool = Field(default=True, validation_alias="SMTP_USE_SSL")
    SMTP_USE_TLS: bool = Field(default=False, validation_alias="SMTP_USE_TLS")
    ADMIN_NOTIFICATION_EMAIL: str = Field(default="system@indunixai.com", validation_alias="ADMIN_NOTIFICATION_EMAIL")
    
    # Rate Card in NGN (Cost per 1,000,000 tokens)
    RATE_CARD_NGN: dict = {
        "indunix-1-spark": {
            "name": "Indunix 1 Spark",
            "prompt_per_million": 1000.0,
            "completion_per_million": 1200.0,
            "context_window": 131072,
            "description": "Sub-second latency, lightweight extraction, high-throughput data processing",
        },
        "indunix-1-core": {
            "name": "Indunix 1 Core",
            "prompt_per_million": 1500.0,
            "completion_per_million": 1800.0,
            "context_window": 65536,
            "description": "Flagship language intelligence, complex PDF document parsing, structured JSON output",
        },
        "indunix-1-reason": {
            "name": "Indunix 1 Reason",
            "prompt_per_million": 2800.0,
            "completion_per_million": 3200.0,
            "context_window": 65536,
            "description": "Extended chain-of-thought, mathematical verification, forensic ledger & legal audit",
        },
        "indunix-edge-local": {
            "name": "Indunix Edge Local",
            "prompt_per_million": 0.0,
            "completion_per_million": 0.0,
            "context_window": 32768,
            "description": "On-premise zero-data-leakage sovereign model lease for enterprise servers",
        },
        # Backward compatibility aliases
        "axion-1-spark": {
            "name": "Indunix 1 Spark",
            "prompt_per_million": 1000.0,
            "completion_per_million": 1200.0,
            "context_window": 131072,
            "description": "Sub-second latency, lightweight extraction, high-throughput data processing",
        },
        "axion-1-core": {
            "name": "Indunix 1 Core",
            "prompt_per_million": 1500.0,
            "completion_per_million": 1800.0,
            "context_window": 65536,
            "description": "Flagship language intelligence, complex PDF document parsing, structured JSON output",
        },
        "axion-1-reason": {
            "name": "Indunix 1 Reason",
            "prompt_per_million": 2800.0,
            "completion_per_million": 3200.0,
            "context_window": 65536,
            "description": "Extended chain-of-thought, mathematical verification, forensic ledger & legal audit",
        },
        "axion-edge-local": {
            "name": "Indunix Edge Local",
            "prompt_per_million": 0.0,
            "completion_per_million": 0.0,
            "context_window": 32768,
            "description": "On-premise zero-data-leakage sovereign model lease for enterprise servers",
        }
    }
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
