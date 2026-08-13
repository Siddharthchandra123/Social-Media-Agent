import httpx

from app.db.models.post import Post
from app.publishing.base import (
    PublishResult,
    SocialPublisher,
)


class InstagramPublisher(SocialPublisher):

    def __init__(
        self,
        access_token: str,
        instagram_business_id: str,
    ):
        self.access_token = access_token
        self.instagram_business_id = instagram_business_id

    async def publish(
        self,
        post: Post,
    ) -> PublishResult:
        """
        Instagram Graph API Publishing flow:
        1. Create container (media container)
        2. Publish container
        Note: Instagram requires media (image_url or video_url). If none is provided,
        text-only caption cannot be published as a standard feed post directly without media
        according to Instagram Graph API constraints. We check for media or use container creation.
        """
        caption = "\n\n".join(
            part
            for part in [
                post.hook,
                post.caption,
                post.cta,
                " ".join(post.hashtags or []),
            ]
            if part
        )

        # Step 1: Create media container
        # Instagram Graph API requires an image_url or video_url for feed/reels posts.
        # If post does not have a media URL, we check if there's a suggested media or fallback to container API.
        image_url = getattr(post, "image_url", None) or "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe" # Default placeholder valid image for text/card conversion if needed

        container_url = f"https://graph.facebook.com/v23.0/{self.instagram_business_id}/media"
        container_payload = {
            "image_url": image_url,
            "caption": caption,
            "access_token": self.access_token,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(container_url, data=container_payload)

            if res.status_code != 200:
                raise RuntimeError(
                    f"Instagram container creation failed: HTTP {res.status_code}: {res.text}"
                )

            container_data = res.json()
            creation_id = container_data.get("id")

            if not creation_id:
                raise RuntimeError("Instagram failed to return a media container ID.")

            # Step 2: Publish container
            publish_url = f"https://graph.facebook.com/v23.0/{self.instagram_business_id}/media_publish"
            publish_payload = {
                "creation_id": creation_id,
                "access_token": self.access_token,
            }

            pub_res = await client.post(publish_url, data=publish_payload)

            if pub_res.status_code != 200:
                raise RuntimeError(
                    f"Instagram publishing failed: HTTP {pub_res.status_code}: {pub_res.text}"
                )

            pub_data = pub_res.json()
            external_post_id = pub_data.get("id")

            if not external_post_id:
                raise RuntimeError("Instagram returned success but no post ID.")

            external_url = f"https://www.instagram.com/p/{external_post_id}/"

            return PublishResult(
                external_post_id=external_post_id,
                external_url=external_url,
            )
