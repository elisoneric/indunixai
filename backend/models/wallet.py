import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from backend.core.database import Base

class TransactionChannel(str, enum.Enum):
    CARD = "CARD"
    BANK_TRANSFER = "BANK_TRANSFER"
    USSD = "USSD"
    PROMO_CREDIT = "PROMO_CREDIT"
    ENTERPRISE_INVOICE = "ENTERPRISE_INVOICE"

class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    balance_ngn = Column(Numeric(14, 4), default=0.0000, nullable=False)
    # Default ₦1,000 promo signup credits
    bonus_credits_ngn = Column(Numeric(14, 4), default=1000.0000, nullable=False)
    currency = Column(String(10), default="NGN", nullable=False)
    is_frozen = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Dedicated NUBAN Virtual Account fields (Persistent)
    dedicated_account_bank = Column(String(100), nullable=True)
    dedicated_account_number = Column(String(50), nullable=True)
    dedicated_account_name = Column(String(200), nullable=True)
    paystack_customer_code = Column(String(100), nullable=True)

    # Relationships
    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = Column(String(36), ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    reference = Column(String(100), unique=True, index=True, nullable=False)
    amount_ngn = Column(Numeric(14, 2), nullable=False)
    channel = Column(String(50), default="CARD", nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    wallet = relationship("Wallet", back_populates="transactions")
