from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.schemas.scheduling import (
    SchedulingRecommendationResponse,
)
from app.scheduling.peak_time import PeakTimeService


router = APIRouter()


@router.get(
    "/recommendations",
    response_model=SchedulingRecommendationResponse,
)
async def get_recommendations(
    platform: str = Query(...),
    timezone: str = Query(
        default=settings.DEFAULT_TIMEZONE
    ),
):
    service = PeakTimeService()

    try:
        return service.recommend(
            platform=platform,
            timezone=timezone,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc