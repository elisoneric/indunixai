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
    SECRET_KEY: str = Field(default="indunix-sovereign-ai-jwt-super-secret-key-ng-2026-xyz", validation_alias="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./indunix.db", validation_alias="DATABASE_URL")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    
    # Paystack Payments
    PAYSTACK_SECRET_KEY: str = Field(default="sk_test_axion_sovereign_mock_secret_key", validation_alias="PAYSTACK_SECRET_KEY")
    PAYSTACK_PUBLIC_KEY: str = Field(default="pk_test_axion_sovereign_mock_public_key", validation_alias="PAYSTACK_PUBLIC_KEY")
    PAYSTACK_BASE_URL: str = "https://api.paystack.co"
    
    # Internal Upstream AI Providers (COMPLETELY ABSTRACTED AND NEVER EXPOSED TO CLIENTS)
    GROQ_API_KEY: Optional[str] = Field(default=None, validation_alias="GROQ_API_KEY")
    DEEPSEEK_API_KEY: Optional[str] = Field(default=None, validation_alias="DEEPSEEK_API_KEY")
    TOGETHER_API_KEY: Optional[str] = Field(default=None, validation_alias="TOGETHER_API_KEY")
    MOCK_UPSTREAM_IF_UNSET: bool = Field(default=True, validation_alias="MOCK_UPSTREAM_IF_UNSET")
    
    # Enterprise On-premise Telemetry Master Signing Key
    ENTERPRISE_LEASE_SIGNING_KEY: str = Field(default="indunix-edge-ent-master-sig-key-2026", validation_alias="ENTERPRISE_LEASE_SIGNING_KEY")
    
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
