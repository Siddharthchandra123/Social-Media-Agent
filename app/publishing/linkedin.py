import httpx

from app.config import settings
from app.db.models.post import Post
from app.publishing.base import (
    PublishResult,
    SocialPublisher,
)


class LinkedInPublisher(SocialPublisher):

    def __init__(
        self,
        access_token: str,
        platform_user_id: str,
    ):
        self.access_token = access_token
        self.platform_user_id = platform_user_id

    async def publish(
        self,
        post: Post,
    ) -> PublishResult:

        author = (
            f"urn:li:person:{self.platform_user_id}"
        )

        commentary = "\n\n".join(
            part
            for part in [
                post.hook,
                post.caption,
                post.cta,
                " ".join(post.hashtags or []),
            ]
            if part
        )

        payload = {
            "author": author,
            "commentary": commentary,
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": [],
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False,
        }

        headers = {
            "Authorization": (
                f"Bearer {self.access_token}"
            ),
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "Linkedin-Version": settings.LINKEDIN_VERSION,
        }

        try:
            async with httpx.AsyncClient(
                timeout=30.0
            ) as client:

                response = await client.post(
                    "https://api.linkedin.com/rest/posts",
                    headers=headers,
                    json=payload,
                )

        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"Could not connect to LinkedIn: {exc}"
            ) from exc

        if response.status_code != 201:
            raise RuntimeError(
                "LinkedIn publishing failed: "
                f"HTTP {response.status_code}: "
                f"{response.text}"
            )

        external_post_id = (
            response.headers.get("x-restli-id")
        )

        if not external_post_id:
            raise RuntimeError(
                "LinkedIn returned HTTP 201 but "
                "no x-restli-id header."
            )

        external_url = (
            "https://www.linkedin.com/feed/update/"
            f"{external_post_id}/"
        )

        return PublishResult(
            external_post_id=external_post_id,
            external_url=external_url,
        )