import uuid
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.models.user import User
from app.db.models.workspace import Workspace
from app.db.models.brand import Brand
from app.db.session import get_db


async def get_current_workspace(
    x_workspace_id: uuid.UUID | None = Header(None, alias="X-Workspace-ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workspace:
    if not x_workspace_id:
        # Fallback to user's first workspace or create a default one
        res = await db.execute(
            select(Workspace).where(Workspace.owner_id == current_user.id)
        )
        workspace = res.scalars().first()
        if not workspace:
            workspace = Workspace(
                name=f"{current_user.name or 'User'}'s Workspace",
                owner_id=current_user.id,
            )
            db.add(workspace)
            await db.commit()
            await db.refresh(workspace)
        return workspace

    res = await db.execute(
        select(Workspace).where(
            Workspace.id == x_workspace_id,
            Workspace.owner_id == current_user.id,
        )
    )
    workspace = res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or unauthorized",
        )
    return workspace


async def get_current_brand(
    x_brand_id: uuid.UUID | None = Header(None, alias="X-Brand-ID"),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Brand:
    if not x_brand_id:
        # Fallback to workspace's first brand or create a default one
        res = await db.execute(
            select(Brand).where(Brand.workspace_id == workspace.id)
        )
        brand = res.scalars().first()
        if not brand:
            brand = Brand(
                workspace_id=workspace.id,
                name="Default Brand",
            )
            db.add(brand)
            await db.commit()
            await db.refresh(brand)
        return brand

    res = await db.execute(
        select(Brand).where(
            Brand.id == x_brand_id,
            Brand.workspace_id == workspace.id,
        )
    )
    brand = res.scalar_one_or_none()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found or unauthorized",
        )
    return brand
