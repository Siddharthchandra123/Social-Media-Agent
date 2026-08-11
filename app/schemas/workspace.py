import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class WorkspaceResponse(BaseModel):
    id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BrandCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    tone: str = Field(default="Professional, engaging, authoritative", max_length=200)
    target_audience: str = Field(default="Professionals, founders, and creators")


class BrandResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    tone: str
    target_audience: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SocialAccountResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    platform: str
    platform_user_id: str
    display_name: str | None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
