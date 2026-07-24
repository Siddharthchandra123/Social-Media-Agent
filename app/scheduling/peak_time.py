from app.schemas.scheduling import (
    EngagementWindow,
    SchedulingRecommendationResponse,
)


BASELINES = {

    "linkedin": [
        EngagementWindow(
            day="tuesday",
            start="09:00",
            end="11:00",
        ),
        EngagementWindow(
            day="wednesday",
            start="09:00",
            end="11:00",
        ),
        EngagementWindow(
            day="thursday",
            start="09:00",
            end="11:00",
        ),
    ],

    "instagram": [
        EngagementWindow(
            day="monday",
            start="18:00",
            end="21:00",
        ),
        EngagementWindow(
            day="wednesday",
            start="18:00",
            end="21:00",
        ),
        EngagementWindow(
            day="friday",
            start="18:00",
            end="21:00",
        ),
    ],

    "facebook": [
        EngagementWindow(
            day="tuesday",
            start="09:00",
            end="12:00",
        ),
        EngagementWindow(
            day="thursday",
            start="09:00",
            end="12:00",
        ),
    ],

    "x": [
        EngagementWindow(
            day="monday",
            start="08:00",
            end="10:00",
        ),
        EngagementWindow(
            day="wednesday",
            start="08:00",
            end="10:00",
        ),
        EngagementWindow(
            day="friday",
            start="08:00",
            end="10:00",
        ),
    ],
}


class PeakTimeService:

    def recommend(
        self,
        platform: str,
        timezone: str,
    ) -> SchedulingRecommendationResponse:

        normalized = platform.lower()

        if normalized not in BASELINES:
            raise ValueError(
                f"Unsupported platform: {platform}"
            )

        return SchedulingRecommendationResponse(
            platform=normalized,
            timezone=timezone,
            source="platform_baseline",
            confidence="low",
            windows=BASELINES[normalized],
        )