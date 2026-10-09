from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.models.user import User
from backend.models.usage import UsageLog
from backend.schemas.dashboard import UsageSummaryOut, UsageLogOut

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Telemetry"])

@router.get("/summary", response_model=UsageSummaryOut)
async def get_usage_summary(
    days: int = Query(30, ge=1, le=90),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Fetch logs for the user
    result = await db.execute(
        select(UsageLog).where(UsageLog.user_id == user.id, UsageLog.created_at >= cutoff)
    )
    logs = result.scalars().all()

    total_requests = len(logs)
    total_prompt_tokens = sum(l.prompt_tokens for l in logs)
    total_completion_tokens = sum(l.completion_tokens for l in logs)
    total_tokens = sum(l.total_tokens for l in logs)
    total_spend_ngn = round(sum(float(l.cost_deducted_ngn) for l in logs), 4)
    avg_latency_ms = round(sum(l.latency_ms for l in logs) / total_requests, 1) if total_requests > 0 else 0.0

    # Model breakdown
    breakdown = {}
    for l in logs:
        m = l.model_requested
        if m not in breakdown:
            breakdown[m] = {"requests": 0, "tokens": 0, "spend_ngn": 0.0}
        breakdown[m]["requests"] += 1
        breakdown[m]["tokens"] += l.total_tokens
        breakdown[m]["spend_ngn"] = round(breakdown[m]["spend_ngn"] + float(l.cost_deducted_ngn), 4)

    # Daily aggregation for charts
    daily_map = {}
    for i in range(days):
        d_str = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        daily_map[d_str] = {"date": d_str, "tokens": 0, "spend_ngn": 0.0, "requests": 0}

    for l in logs:
        d_str = l.created_at.strftime("%Y-%m-%d")
        if d_str in daily_map:
            daily_map[d_str]["tokens"] += l.total_tokens
            daily_map[d_str]["spend_ngn"] = round(daily_map[d_str]["spend_ngn"] + float(l.cost_deducted_ngn), 4)
            daily_map[d_str]["requests"] += 1

    return UsageSummaryOut(
        total_requests=total_requests,
        total_prompt_tokens=total_prompt_tokens,
        total_completion_tokens=total_completion_tokens,
        total_tokens=total_tokens,
        total_spend_ngn=total_spend_ngn,
        avg_latency_ms=avg_latency_ms,
        model_breakdown=breakdown,
        daily_usage=list(daily_map.values())
    )

@router.get("/logs", response_model=List[UsageLogOut])
async def get_usage_logs(
    limit: int = Query(50, ge=1, le=200),
    model: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(UsageLog).where(UsageLog.user_id == user.id)
    if model:
        query = query.where(UsageLog.model_requested == model)
    query = query.order_by(UsageLog.created_at.desc()).limit(limit)

    result = await db.execute(query)
    logs = result.scalars().all()
    return [UsageLogOut.model_validate(l) for l in logs]
