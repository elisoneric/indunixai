from typing import Optional, Dict, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from backend.models.user import UserRole
from backend.schemas.auth import UserOut

class AdminLoginRequest(BaseModel):
    identifier: str  # username (indunixai) or email (admin@indunixai.com)
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_change_password: bool
    message: str
    user: UserOut

class AdminPasswordChangeRequest(BaseModel):
    new_password: str

class AdminCreditAdjustRequest(BaseModel):
    amount_ngn: float
    credit_type: str = "bonus"  # "bonus" or "cash"
    reason: str
    notify_user: bool = True

class AdminUserStatusUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    is_frozen: Optional[bool] = None
    role: Optional[UserRole] = None

class AdminModelRate(BaseModel):
    name: Optional[str] = None
    prompt_per_million: float
    completion_per_million: float
    context_window: Optional[int] = None
    description: Optional[str] = None

class AdminPricingUpdateRequest(BaseModel):
    models: Dict[str, AdminModelRate]

class AdminPromoCampaigns(BaseModel):
    signup_bonus_ngn: float = 1000.0
    sale_active: bool = False
    sale_title: str = "Promotional Discount"
    sale_discount_percent: float = 0.0
    sale_ends_at: Optional[str] = None
    banner_active: bool = False
    banner_text: str = ""

class AdminPromoCampaignsUpdate(BaseModel):
    signup_bonus_ngn: Optional[float] = None
    sale_active: Optional[bool] = None
    sale_title: Optional[str] = None
    sale_discount_percent: Optional[float] = None
    sale_ends_at: Optional[str] = None
    banner_active: Optional[bool] = None
    banner_text: Optional[str] = None

class AdminUserListItem(BaseModel):
    id: str
    username: Optional[str] = None
    email: str
    full_name: str
    company_name: Optional[str] = None
    role: UserRole
    is_active: bool
    must_change_password: bool
    created_at: datetime
    balance_ngn: float
    bonus_credits_ngn: float
    total_available_ngn: float
    is_frozen: bool
    dedicated_account_number: Optional[str] = None
    dedicated_account_bank: Optional[str] = None
    total_api_keys: int
    total_tokens: int
    total_requests: int

class ModelUnitEconomics(BaseModel):
    model_id: str
    model_name: str
    requests: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    retail_revenue_ngn: float
    upstream_cost_usd: float
    upstream_cost_ngn: float
    gross_profit_ngn: float
    margin_percent: float

class DeepSeekLiveBalance(BaseModel):
    status: str  # "connected", "unconfigured", "error", "mock"
    is_available: bool
    currency: str = "USD"
    total_balance: float = 0.0
    granted_balance: float = 0.0
    topped_up_balance: float = 0.0
    balance_ngn: float = 0.0
    message: str = ""

class DepositFeeSettings(BaseModel):
    fee_strategy: str = "absorb"  # "absorb" or "pass_through"
    fee_percent: float = 1.5
    flat_fee_ngn: float = 100.0
    flat_fee_threshold_ngn: float = 2500.0
    fee_cap_ngn: float = 2000.0
    fx_rate_usd_ngn: float = 1500.0

class AdminFxRateUpdate(BaseModel):
    fx_rate_usd_ngn: float


class AdminFinancialReport(BaseModel):
    # Cash Inflow (Deposits)
    gross_inflow_ngn: float
    gateway_fees_ngn: float
    net_inflow_credited_ngn: float
    deposit_count: int
    avg_deposit_amount_ngn: float

    # Recognized Revenue (Tokens meter)
    recognized_revenue_ngn: float
    total_tokens_consumed: int
    total_requests: int

    # Wholesale COGS
    upstream_cogs_usd: float
    upstream_cogs_ngn: float
    fx_rate_usd_ngn: float

    # Profitability
    gross_profit_ngn: float
    gross_margin_percent: float
    net_profit_ngn: float
    net_margin_percent: float

    # Live DeepSeek & Liabilities
    deepseek_balance: DeepSeekLiveBalance
    user_liabilities_ngn: float
    solvency_coverage_ratio: float

    # Deposit Fee Settings
    deposit_fee_settings: DepositFeeSettings

    # Per-Model Breakdown
    model_economics: List[ModelUnitEconomics]

class AdminSmtpSettings(BaseModel):
    host: Optional[str] = None
    port: int = 465
    user: Optional[str] = None
    password: Optional[str] = None  # Masked when returned
    from_email: str = "notifications@indunixai.com"
    from_name: str = "Indunix AI"
    use_ssl: bool = True
    use_tls: bool = False
    is_configured: bool = False

class AdminSmtpUpdateRequest(BaseModel):
    host: str
    port: int = 465
    user: str
    password: Optional[str] = None
    from_email: Optional[str] = "notifications@indunixai.com"
    from_name: Optional[str] = "Indunix AI"
    use_ssl: Optional[bool] = True
    use_tls: Optional[bool] = False

class AdminSmtpTestRequest(BaseModel):
    recipient_email: Optional[str] = None
