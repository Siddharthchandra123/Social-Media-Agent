import asyncio

import httpx

from app.db.models.post import Post
from app.publishing.base import (
    PublishResult,
    SocialPublisher,
)

GRAPH_API_BASE = "https://graph.facebook.com/v23.0"

POLL_INTERVAL_SECONDS = 2.0
MAX_POLL_ATTEMPTS = 30
CONTAINER_READY_STATUS = "FINISHED"
CONTAINER_ERROR_STATUS = "ERROR"
CONTAINER_EXPIRED_STATUS = "EXPIRED"


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
        1. Create a media container (image_url or video_url)
        2. Poll the container status until it is FINISHED
        3. Publish the finished container
        Instagram media processing is asynchronous, so the container must be
        ready before the publish endpoint will accept it.
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

        # Instagram Graph API requires an image_url or video_url for feed posts.
        # If the post does not carry a media URL, fall back to the placeholder
        # image so a card-style post can still be published.
        image_url = getattr(post, "image_url", None) or "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: Create the media container
            container_url = f"{GRAPH_API_BASE}/{self.instagram_business_id}/media"
            container_payload = {
                "image_url": image_url,
                "caption": caption,
                "access_token": self.access_token,
            }

            res = await client.post(container_url, data=container_payload)

            if res.status_code != 200:
                raise RuntimeError(
                    f"Instagram container creation failed: HTTP {res.status_code}: {res.text}"
                )

            container_data = res.json()
            creation_id = container_data.get("id")

            if not creation_id:
                raise RuntimeError("Instagram failed to return a media container ID.")

            # Step 2: Wait until the container is finished processing
            await self._wait_until_ready(client, creation_id)

            # Step 3: Publish the finished container
            publish_url = f"{GRAPH_API_BASE}/{self.instagram_business_id}/media_publish"
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

    async def _wait_until_ready(
        self,
        client: httpx.AsyncClient,
        creation_id: str,
    ) -> None:
        """
        Poll the media container's status_code until it reaches FINISHED.

        Fails immediately if Instagram reports ERROR or EXPIRED, and raises a
        timeout error if the container never becomes ready within the retry
        limit.
        """
        status_url = f"{GRAPH_API_BASE}/{creation_id}"
        params = {
            "fields": "status_code",
            "access_token": self.access_token,
        }

        for attempt in range(1, MAX_POLL_ATTEMPTS + 1):
            status_res = await client.get(status_url, params=params)

            if status_res.status_code != 200:
                raise RuntimeError(
                    f"Instagram container status check failed: HTTP {status_res.status_code}: {status_res.text}"
                )

            status_data = status_res.json()
            status_code = status_data.get("status_code")

            if status_code == CONTAINER_READY_STATUS:
                return

            if status_code == CONTAINER_ERROR_STATUS:
                raise RuntimeError(
                    "Instagram media container failed to process: "
                    f"{status_data.get('status', 'unknown error')}"
                )

            if status_code == CONTAINER_EXPIRED_STATUS:
                raise RuntimeError(
                    "Instagram media container expired before it could be published."
                )

            if attempt == MAX_POLL_ATTEMPTS:
                raise TimeoutError(
                    "Instagram media container was not ready within "
                    f"{MAX_POLL_ATTEMPTS * POLL_INTERVAL_SECONDS:.0f} seconds. "
                    "Aborting publish."
                )

            await asyncio.sleep(POLL_INTERVAL_SECONDS)
