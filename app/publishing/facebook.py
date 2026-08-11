import httpx

from app.db.models.post import Post
from app.publishing.base import (
    PublishResult,
    SocialPublisher,
)


class FacebookPublisher(SocialPublisher):

    def __init__(
        self,
        page_access_token: str,
        page_id: str,
    ):
        self.page_access_token = page_access_token
        self.page_id = page_id

    async def publish(
        self,
        post: Post,
    ) -> PublishResult:

        message = "\n\n".join(
            part
            for part in [
                post.hook,
                post.caption,
                post.cta,
                " ".join(post.hashtags or []),
            ]
            if part
        )

        url = f"https://graph.facebook.com/v23.0/{self.page_id}/feed"
        payload = {
            "message": message,
            "access_token": self.page_access_token,
        }

        try:
            async with httpx.AsyncClient(
                timeout=30.0
            ) as client:
                response = await client.post(
                    url,
                    data=payload,
                )
        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"Could not connect to Facebook: {exc}"
            ) from exc

        if response.status_code != 200:
            raise RuntimeError(
                "Facebook publishing failed: "
                f"HTTP {response.status_code}: "
                f"{response.text}"
            )

        data = response.json()
        external_post_id = data.get("id")

        if not external_post_id:
            raise RuntimeError(
                "Facebook returned success but no post ID."
            )

        external_url = f"https://www.facebook.com/{external_post_id}"

        return PublishResult(
            external_post_id=external_post_id,
            external_url=external_url,
        )
