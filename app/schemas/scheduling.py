from pydantic import BaseModel


class EngagementWindow(BaseModel):
    day: str
    start: str
    end: str


class SchedulingRecommendationResponse(BaseModel):
    platform: str
    timezone: str

    source: str
    confidence: str

    windows: list[EngagementWindow]