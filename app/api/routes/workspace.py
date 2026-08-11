import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.workspace_dependencies import get_current_workspace, get_current_brand
from app.db.models.user import User
from app.db.models.workspace import Workspace
from app.db.models.brand import Brand
from app.db.session import get_db
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    BrandCreate,
    BrandResponse,
    SocialAccountResponse,
)
from app.db.models.social_account import SocialAccount

router = APIRouter()


@router.get("/workspaces", response_model=list[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Workspace).where(Workspace.owner_id == current_user.id)
    )
    return list(res.scalars().all())


@router.post("/workspaces", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    body: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = Workspace(
        name=body.name,
        owner_id=current_user.id,
    )
    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)
    return workspace


@router.get("/workspaces/{workspace_id}/brands", response_model=list[BrandResponse])
async def list_brands(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify workspace ownership
    ws_res = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == current_user.id,
        )
    )
    if not ws_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Workspace not found")

    res = await db.execute(
        select(Brand).where(Brand.workspace_id == workspace_id)
    )
    return list(res.scalars().all())


@router.post("/workspaces/{workspace_id}/brands", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    workspace_id: uuid.UUID,
    body: BrandCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws_res = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == current_user.id,
        )
    )
    if not ws_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Workspace not found")

    brand = Brand(
        workspace_id=workspace_id,
        name=body.name,
        tone=body.tone,
        target_audience=body.target_audience,
    )
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return brand


@router.get("/brands/{brand_id}/social-accounts", response_model=list[SocialAccountResponse])
async def list_brand_social_accounts(
    brand_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership via workspace
    brand_res = await db.execute(
        select(Brand)
        .join(Workspace, Brand.workspace_id == Workspace.id)
        .where(
            Brand.id == brand_id,
            Workspace.owner_id == current_user.id,
        )
    )
    if not brand_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Brand not found")

    res = await db.execute(
        select(SocialAccount).where(SocialAccount.brand_id == brand_id)
    )
    return list(res.scalars().all())
