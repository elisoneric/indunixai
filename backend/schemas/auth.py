from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from backend.models.user import UserRole

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    company_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: Optional[str] = None
    new_password: str

class UserPreferences(BaseModel):
    login_alerts: bool = True
    deposit_receipts: bool = True
    low_balance_alerts: bool = True
    usage_reports: bool = True
    theme: str = "dark"
    clean_numbers: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None

