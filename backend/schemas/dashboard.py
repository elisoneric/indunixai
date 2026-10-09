from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from backend.models.enterprise import BillingCycle, ContractStatus

class ApiKeyCreate(BaseModel):
    name: str
    monthly_spend_limit_ngn: Optional[float] = None

class ApiKeyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    key_prefix: str
    is_active: bool
    monthly_spend_limit_ngn: Optional[float] = None
    current_month_spend_ngn: float
    last_used_at: Optional[datetime] = None
    created_at: datetime

class ApiKeyCreatedOut(BaseModel):
    api_key: ApiKeyOut
    secret_key: str  # The full secret shown exactly once!
    warning: str = "Save this key now. It will never be shown again."

class WalletOut(BaseModel):
    balance_ngn: float
    bonus_credits_ngn: float
    total_available_ngn: float
    currency: str = "NGN"
    is_frozen: bool

class UsageLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    model_requested: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_deducted_ngn: float
    latency_ms: int
    is_stream: bool
    created_at: datetime

class UsageSummaryOut(BaseModel):
    total_requests: int
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    total_spend_ngn: float
    avg_latency_ms: float
    model_breakdown: Dict[str, Dict[str, Any]]
    daily_usage: List[Dict[str, Any]]

class EnterpriseHeartbeatRequest(BaseModel):
    license_key: str
    machine_fingerprint: str
    uptime_hours: Optional[float] = 0.0

class EnterpriseHeartbeatResponse(BaseModel):
    status: str  # AUTHORIZED or UNAUTHORIZED
    lease_token: Optional[str] = None
    expires_at: Optional[datetime] = None
    organization_name: Optional[str] = None
    monthly_included_tokens: Optional[int] = None
    message: Optional[str] = None

class EnterpriseContractOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_name: str
    contact_email: str
    fixed_monthly_retainer_ngn: float
    billing_cycle: BillingCycle
    contract_status: ContractStatus
    monthly_included_tokens: int
    license_key: str
    active_until: datetime
    last_heartbeat_at: Optional[datetime] = None
    created_at: datetime

class EnterpriseInquiryCreate(BaseModel):
    full_name: str
    company_name: str
    email: str
    phone: str
    deployment_type: str = "On-Premise GPU Node"
    estimated_volume: Optional[str] = "10M - 50M tokens/month"
    notes: Optional[str] = None

class EnterpriseInquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    company_name: str
    email: str
    phone: str
    deployment_type: str
    estimated_volume: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime
