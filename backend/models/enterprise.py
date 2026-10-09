import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Numeric, BigInteger, DateTime, Enum
from backend.core.database import Base

class BillingCycle(str, enum.Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    ANNUAL = "ANNUAL"

class ContractStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PENDING_RENEWAL = "PENDING_RENEWAL"
    EXPIRED = "EXPIRED"

class EnterpriseContract(Base):
    __tablename__ = "enterprise_contracts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False)
    fixed_monthly_retainer_ngn = Column(Numeric(14, 2), nullable=False)
    billing_cycle = Column(Enum(BillingCycle), default=BillingCycle.MONTHLY, nullable=False)
    contract_status = Column(Enum(ContractStatus), default=ContractStatus.ACTIVE, nullable=False)
    monthly_included_tokens = Column(BigInteger, default=50_000_000, nullable=False)
    license_key = Column(String(128), unique=True, index=True, nullable=False)
    machine_fingerprint = Column(String(128), nullable=True)
    last_heartbeat_at = Column(DateTime, nullable=True)
    active_until = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class EnterpriseInquiry(Base):
    __tablename__ = "enterprise_inquiries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(64), nullable=False)
    deployment_type = Column(String(128), nullable=False)
    estimated_volume = Column(String(128), nullable=True)
    notes = Column(String(1024), nullable=True)
    status = Column(String(64), default="PENDING_CALL", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
