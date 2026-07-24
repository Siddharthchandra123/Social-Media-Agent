from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PostStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"


class CreatePostRequest(BaseModel):
    candidate_id: UUID


class SchedulePostRequest(BaseModel):
    scheduled_at: datetime


class PostResponse(BaseModel):
    id: UUID
    candidate_id: UUID | None

    platform: str

    hook: str
    caption: str
    cta: str
    hashtags: list[str]

    status: PostStatus

    scheduled_at: datetime | None
    published_at: datetime | None

    external_post_id: str | None
    failure_reason: str | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )