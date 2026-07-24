from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class Platform(str, Enum):
    LINKEDIN = "linkedin"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    X = "x"


class ContentGenerationRequest(BaseModel):
    platform: Platform

    topic: str = Field(
        min_length=3,
        max_length=500,
    )

    objective: str = Field(
        default="engagement",
        min_length=2,
        max_length=100,
    )

    tone: str = Field(
        default="professional",
        min_length=2,
        max_length=200,
    )

    audience: str = Field(
        default="general audience",
        min_length=2,
        max_length=500,
    )


class PostCandidateGenerated(BaseModel):
    hook: str = Field(min_length=1)
    caption: str = Field(min_length=1)
    cta: str = Field(min_length=1)

    hashtags: list[str]

    content_type: str
    suggested_media: str


class GeneratedCandidates(BaseModel):
    candidates: list[PostCandidateGenerated]

    @field_validator("candidates")
    @classmethod
    def validate_candidate_count(cls, value):
        if len(value) != 3:
            raise ValueError("Gemini must return exactly 3 candidates")
        return value


class ContentEvaluation(BaseModel):
    hook_score: int = Field(ge=0, le=100)
    relevance_score: int = Field(ge=0, le=100)
    brand_score: int = Field(ge=0, le=100)
    readability_score: int = Field(ge=0, le=100)
    cta_score: int = Field(ge=0, le=100)
    platform_score: int = Field(ge=0, le=100)

    explanation: str


class CandidateResponse(BaseModel):
    id: UUID

    hook: str
    caption: str
    cta: str

    hashtags: list[str]

    content_type: str
    suggested_media: str

    hook_score: int
    relevance_score: int
    brand_score: int
    readability_score: int
    cta_score: int
    platform_score: int

    total_score: float
    rank: int

    evaluation_explanation: str

    model_config = {
        "from_attributes": True
    }


class GenerationResponse(BaseModel):
    id: UUID

    platform: str
    topic: str
    objective: str
    tone: str
    audience: str

    status: str

    recommended_candidate_id: UUID | None

    created_at: datetime

    candidates: list[CandidateResponse]

    model_config = {
        "from_attributes": True
    }