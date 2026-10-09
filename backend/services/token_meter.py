import math
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.core.config import settings
from backend.core.exceptions import InsufficientBalanceException, SpendLimitExceededException
from backend.models.wallet import Wallet
from backend.models.api_key import ApiKey
from backend.models.usage import UsageLog

class TokenMeter:
    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Heuristic token estimator (approx 4 chars per token)."""
        if not text:
            return 1
        return max(1, math.ceil(len(text) / 3.8))

    @staticmethod
    def calculate_cost_ngn(model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """
        Calculates cost in NGN based on the proprietary rate card.
        Formula: (prompt_tokens / 1,000,000 * in_rate) + (completion_tokens / 1,000,000 * out_rate)
        """
        model_info = settings.RATE_CARD_NGN.get(model, settings.RATE_CARD_NGN.get("indunix-1-core", settings.RATE_CARD_NGN["axion-1-core"]))
        in_rate = model_info.get("prompt_per_million", 1500.0)
        out_rate = model_info.get("completion_per_million", 1800.0)

        cost = (prompt_tokens / 1_000_000.0 * in_rate) + (completion_tokens / 1_000_000.0 * out_rate)
        return round(cost, 6)

    @classmethod
    async def preflight_balance_check(cls, db: AsyncSession, user_id: str, api_key: Optional[ApiKey] = None) -> Wallet:
        """
        Verifies wallet has at least ₦50.00 total credits.
        Verifies API key has not exceeded monthly spend ceiling.
        """
        result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
        wallet = result.scalar_one_or_none()
        if not wallet:
            raise InsufficientBalanceException("Wallet record not found.")

        if wallet.is_frozen:
            raise InsufficientBalanceException("Wallet is temporarily frozen. Contact support.")

        total_funds = float(wallet.balance_ngn) + float(wallet.bonus_credits_ngn)
        if total_funds < 50.0:
            raise InsufficientBalanceException(
                f"Insufficient Indunix AI wallet balance (₦{total_funds:.2f}). Minimum ₦50 required. Please top up your Naira balance at console.indunixai.com"
            )

        if api_key and api_key.monthly_spend_limit_ngn is not None:
            if float(api_key.current_month_spend_ngn) >= float(api_key.monthly_spend_limit_ngn):
                raise SpendLimitExceededException()

        return wallet

    @classmethod
    async def deduct_and_log(
        cls,
        db: AsyncSession,
        user_id: str,
        api_key_id: Optional[str],
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        latency_ms: int,
        is_stream: bool,
        status_code: int = 200,
        ip_hash: Optional[str] = None
    ) -> Tuple[float, UsageLog]:
        """
        Atomically deducts cost from bonus_credits_ngn first, then balance_ngn.
        Updates API key spend and writes immutable usage_log.
        """
        total_tokens = prompt_tokens + completion_tokens
        cost_ngn = cls.calculate_cost_ngn(model, prompt_tokens, completion_tokens)

        # Atomic wallet deduction
        result = await db.execute(select(Wallet).where(Wallet.user_id == user_id).with_for_update())
        wallet = result.scalar_one()

        remaining_to_deduct = cost_ngn
        bonus = float(wallet.bonus_credits_ngn)
        balance = float(wallet.balance_ngn)

        if bonus >= remaining_to_deduct:
            wallet.bonus_credits_ngn = round(bonus - remaining_to_deduct, 4)
            remaining_to_deduct = 0.0
        else:
            remaining_to_deduct -= bonus
            wallet.bonus_credits_ngn = 0.0
            wallet.balance_ngn = round(max(0.0, balance - remaining_to_deduct), 4)

        # If api_key_id is provided, update its spend and last_used_at
        if api_key_id:
            key_res = await db.execute(select(ApiKey).where(ApiKey.id == api_key_id))
            api_key = key_res.scalar_one_or_none()
            if api_key:
                from datetime import datetime, timezone
                api_key.current_month_spend_ngn = round(float(api_key.current_month_spend_ngn) + cost_ngn, 4)
                api_key.last_used_at = datetime.now(timezone.utc)

        # Create immutable usage log
        usage_log = UsageLog(
            user_id=user_id,
            api_key_id=api_key_id,
            model_requested=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost_deducted_ngn=cost_ngn,
            latency_ms=latency_ms,
            status_code=status_code,
            is_stream=is_stream,
            ip_hash=ip_hash
        )
        db.add(usage_log)
        await db.commit()
        await db.refresh(usage_log)

        return cost_ngn, usage_log
