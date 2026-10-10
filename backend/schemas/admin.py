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
