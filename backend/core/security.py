import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import jwt
import bcrypt
from backend.core.config import settings

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def generate_api_key() -> Tuple[str, str, str]:
    """
    Generates a production Indunix API key.
    Returns:
        full_secret: The complete key string (e.g., indunix-live-sk-38a7c29e...)
        key_prefix: First 18 characters for identification in UI/logs (e.g., indunix-live-sk-38...)
        hashed_secret: SHA-256 hex digest of the full secret
    """
    random_bytes = secrets.token_hex(24)
    full_secret = f"indunix-live-sk-{random_bytes}"
    key_prefix = full_secret[:19]
    hashed_secret = hash_api_key(full_secret)
    return full_secret, key_prefix, hashed_secret

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.strip().encode("utf-8")).hexdigest()

def verify_paystack_signature(payload_bytes: bytes, signature_header: str) -> bool:
    """Verifies the Paystack webhook signature using HMAC SHA-512."""
    if not signature_header:
        return False
    key = (settings.PAYSTACK_SECRET_KEY or "").strip()
    computed_hmac = hmac.new(
        key.encode("utf-8"),
        payload_bytes,
        hashlib.sha512
    ).hexdigest()
    return hmac.compare_digest(computed_hmac, signature_header.strip())

def sign_enterprise_lease(contract_id: str, machine_fingerprint: str, hours_valid: int = 24) -> Tuple[str, datetime]:
    """Generates an encrypted/signed 24-hour runtime license lease token for Axion Edge."""
    expires_at = datetime.now(timezone.utc) + timedelta(hours=hours_valid)
    payload = {
        "sub": contract_id,
        "machine_fingerprint": machine_fingerprint,
        "type": "axion-edge-license-lease",
        "exp": expires_at
    }
    token = jwt.encode(payload, settings.ENTERPRISE_LEASE_SIGNING_KEY, algorithm="HS256")
    return token, expires_at
