from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from backend.models.wallet import TransactionStatus

class DepositRequest(BaseModel):
    amount_ngn: float = Field(..., ge=1000.0, description="Minimum deposit is ₦1,000")
    channel: Optional[str] = "CARD"
    callback_url: Optional[str] = None

class DepositResponse(BaseModel):
    authorization_url: str
    access_code: str
    reference: str
    amount_ngn: float
    public_key: Optional[str] = None

class PaystackWebhookPayload(BaseModel):
    event: str
    data: Dict[str, Any]

class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reference: str
    amount_ngn: float
    channel: str
    status: TransactionStatus
    created_at: datetime
    metadata_json: Optional[Dict[str, Any]] = None

class ManualVerifyRequest(BaseModel):
    reference: str
