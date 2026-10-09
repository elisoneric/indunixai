from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.database import get_db
from backend.models.enterprise import EnterpriseContract, EnterpriseInquiry, BillingCycle, ContractStatus
from backend.schemas.dashboard import EnterpriseContractOut, EnterpriseInquiryCreate, EnterpriseInquiryOut

router = APIRouter(prefix="/api/enterprise", tags=["Enterprise Retainers & Contracts"])

@router.get("/contracts", response_model=List[EnterpriseContractOut])
async def list_enterprise_contracts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EnterpriseContract).order_by(EnterpriseContract.created_at.desc()))
    contracts = result.scalars().all()
    return [EnterpriseContractOut.model_validate(c) for c in contracts]

@router.post("/inquire", status_code=status.HTTP_201_CREATED)
async def submit_enterprise_inquiry(
    inquiry: EnterpriseInquiryCreate,
    db: AsyncSession = Depends(get_db)
):
    """Submits a corporate lead for enterprise on-premise hardware lease or custom pricing."""
    new_inquiry = EnterpriseInquiry(
        full_name=inquiry.full_name,
        company_name=inquiry.company_name,
        email=inquiry.email,
        phone=inquiry.phone,
        deployment_type=inquiry.deployment_type,
        estimated_volume=inquiry.estimated_volume,
        notes=inquiry.notes,
        status="PENDING_CALL"
    )
    db.add(new_inquiry)
    await db.commit()
    await db.refresh(new_inquiry)

    # In production, dispatch notification to enterprise sales director / WhatsApp webhook
    print(
        f"[ENTERPRISE LEAD DISPATCH] New Inquiry #{new_inquiry.id}: "
        f"Company: {new_inquiry.company_name} | Name: {new_inquiry.full_name} | "
        f"Phone: {new_inquiry.phone} | Email: {new_inquiry.email} | "
        f"Type: {new_inquiry.deployment_type}. Action: Schedule callback within 24h."
    )

    return {
        "status": "success",
        "inquiry_id": new_inquiry.id,
        "message": "Thank you! Our Enterprise Infrastructure team has received your inquiry and will call you within 24 hours to review your deployment specifications."
    }

@router.get("/inquiries", response_model=List[EnterpriseInquiryOut])
async def list_enterprise_inquiries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EnterpriseInquiry).order_by(EnterpriseInquiry.created_at.desc()))
    inquiries = result.scalars().all()
    return [EnterpriseInquiryOut.model_validate(i) for i in inquiries]
