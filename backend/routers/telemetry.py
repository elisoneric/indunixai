from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.database import get_db
from backend.core.security import sign_enterprise_lease
from backend.models.enterprise import EnterpriseContract, ContractStatus
from backend.schemas.dashboard import EnterpriseHeartbeatRequest, EnterpriseHeartbeatResponse

router = APIRouter(prefix="/v1/enterprise", tags=["Enterprise Telemetry"])

@router.post("/heartbeat", response_model=EnterpriseHeartbeatResponse)
async def enterprise_heartbeat(
    payload: EnterpriseHeartbeatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    On-premise Axion Edge license verification & 24h lease renewal.
    Used by enterprise edge nodes (e.g. on-prem private GPU clusters).
    """
    result = await db.execute(
        select(EnterpriseContract).where(EnterpriseContract.license_key == payload.license_key)
    )
    contract = result.scalar_one_or_none()

    if not contract:
        return EnterpriseHeartbeatResponse(
            status="UNAUTHORIZED",
            message="Invalid enterprise license key. Local Axion Edge placed on standby."
        )

    # Check contract expiration and status
    now = datetime.now(timezone.utc)
    # Ensure timezone aware comparison
    contract_active_until = contract.active_until
    if contract_active_until.tzinfo is None:
        contract_active_until = contract_active_until.replace(tzinfo=timezone.utc)

    if contract.contract_status != ContractStatus.ACTIVE or contract_active_until < now:
        return EnterpriseHeartbeatResponse(
            status="UNAUTHORIZED",
            organization_name=contract.organization_name,
            message="Contract expired or pending renewal. Local Axion Edge placed on standby."
        )

    # Update contract heartbeat telemetry
    contract.last_heartbeat_at = now
    contract.machine_fingerprint = payload.machine_fingerprint
    await db.commit()

    # Generate 24-hour signed runtime lease token
    lease_token, expires_at = sign_enterprise_lease(
        contract_id=contract.id,
        machine_fingerprint=payload.machine_fingerprint,
        hours_valid=24
    )

    return EnterpriseHeartbeatResponse(
        status="AUTHORIZED",
        lease_token=lease_token,
        expires_at=expires_at,
        organization_name=contract.organization_name,
        monthly_included_tokens=int(contract.monthly_included_tokens),
        message="Axion Edge sovereign runtime authorized for 24 hours."
    )
