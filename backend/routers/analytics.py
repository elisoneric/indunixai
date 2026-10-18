from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
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
    limit: int = Query(100, ge=1, le=1000),
    model: Optional[str] = None,
    api_key_id: Optional[str] = None,
    time_range: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves detailed usage & telemetry logs with model, API key, and time-range filtering.
    """
    query = (
        select(UsageLog)
        .options(selectinload(UsageLog.api_key))
        .where(UsageLog.user_id == user.id)
    )

    if model and model.strip():
        query = query.where(UsageLog.model_requested == model.strip())

    if api_key_id and api_key_id.strip():
        val = api_key_id.strip().lower()
        if val in ("none", "session", "playground"):
            query = query.where(UsageLog.api_key_id.is_(None))
        else:
            query = query.where(UsageLog.api_key_id == api_key_id.strip())

    # Time filtering
    now = datetime.now(timezone.utc)
    if time_range:
        tr = time_range.strip().lower()
        if tr in ("24h", "today", "1d"):
            cutoff = (now - timedelta(hours=24)).replace(tzinfo=None)
            query = query.where(UsageLog.created_at >= cutoff)
        elif tr in ("7d", "week"):
            cutoff = (now - timedelta(days=7)).replace(tzinfo=None)
            query = query.where(UsageLog.created_at >= cutoff)
        elif tr in ("30d", "month"):
            cutoff = (now - timedelta(days=30)).replace(tzinfo=None)
            query = query.where(UsageLog.created_at >= cutoff)

    if start_date:
        try:
            sd = datetime.fromisoformat(start_date.replace("Z", "+00:00")).replace(tzinfo=None)
            query = query.where(UsageLog.created_at >= sd)
        except Exception:
            pass

    if end_date:
        try:
            ed = datetime.fromisoformat(end_date.replace("Z", "+00:00")).replace(tzinfo=None)
            query = query.where(UsageLog.created_at <= ed)
        except Exception:
            pass

    query = query.order_by(UsageLog.created_at.desc()).limit(limit)

    result = await db.execute(query)
    logs = result.scalars().all()

    output = []
    for l in logs:
        key_name = getattr(l, "api_key_name", None) or (l.api_key.name if l.api_key else None)
        key_prefix = getattr(l, "api_key_prefix", None) or (l.api_key.key_prefix if l.api_key else None)
        output.append(UsageLogOut(
            id=l.id,
            model_requested=l.model_requested,
            prompt_tokens=l.prompt_tokens,
            completion_tokens=l.completion_tokens,
            total_tokens=l.total_tokens,
            cost_deducted_ngn=float(l.cost_deducted_ngn),
            latency_ms=l.latency_ms,
            is_stream=l.is_stream,
            created_at=l.created_at,
            api_key_id=l.api_key_id,
            api_key_name=key_name,
            api_key_prefix=key_prefix,
        ))

    return output


@router.get("/logs/grouped")
async def get_grouped_usage_logs(
    group_by: str = Query("api_key", pattern="^(api_key|model|date)$"),
    time_range: Optional[str] = None,
    model: Optional[str] = None,
    api_key_id: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Groups and aggregates usage logs by API Key, Model, or Date with metric summaries.
    """
    logs = await get_usage_logs(
        limit=1000,
        model=model,
        api_key_id=api_key_id,
        time_range=time_range,
        user=user,
        db=db
    )

    groups = {}
    for l in logs:
        if group_by == "api_key":
            group_key = l.api_key_id or "session"
            group_name = l.api_key_name or ("Browser Session / Playground" if not l.api_key_id else "Unknown Key")
            extra = {"api_key_prefix": l.api_key_prefix}
        elif group_by == "model":
            group_key = l.model_requested
            group_name = l.model_requested
            extra = {}
        else: # date
            d_str = l.created_at.strftime("%Y-%m-%d") if isinstance(l.created_at, datetime) else str(l.created_at)[:10]
            group_key = d_str
            group_name = d_str
            extra = {}

        if group_key not in groups:
            groups[group_key] = {
                "group_key": group_key,
                "group_name": group_name,
                "total_requests": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
                "total_cost_ngn": 0.0,
                "latencies": [],
                "logs": [],
                **extra
            }

        g = groups[group_key]
        g["total_requests"] += 1
        g["prompt_tokens"] += l.prompt_tokens
        g["completion_tokens"] += l.completion_tokens
        g["total_tokens"] += l.total_tokens
        g["total_cost_ngn"] = round(g["total_cost_ngn"] + l.cost_deducted_ngn, 4)
        g["latencies"].append(l.latency_ms)
        g["logs"].append(l)

    # Compute averages
    result = []
    for g in groups.values():
        avg_lat = round(sum(g["latencies"]) / len(g["latencies"]), 1) if g["latencies"] else 0.0
        del g["latencies"]
        g["avg_latency_ms"] = avg_lat
        result.append(g)

    # Sort descending by total_requests or cost
    result.sort(key=lambda x: x["total_requests"], reverse=True)
    return result
