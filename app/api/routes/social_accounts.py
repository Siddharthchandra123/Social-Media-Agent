import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.models.user import User
from app.db.models.social_account import SocialAccount
from app.db.session import get_db
from pydantic import BaseModel, ConfigDict
from datetime import datetime

router = APIRouter()


class SocialAccountResponse(BaseModel):
    id: uuid.UUID
    platform: str
    platform_user_id: str
    display_name: str | None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get("/social-accounts", response_model=list[SocialAccountResponse])
async def list_social_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.status == "active",
        )
    )
    return list(res.scalars().all())


@router.delete("/social-accounts/{platform}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_social_account(
    platform: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == platform,
        )
    )
    account = res.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")

    # Mark inactive or delete
    account.status = "disconnected"
    await db.delete(account) # or update status = disconnected
    await db.commit()
    return None
