import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.post import Post
from app.publishing.base import SocialPublisher


class PublishingService:

    def __init__(
        self,
        db: AsyncSession,
        publisher: SocialPublisher,
    ):
        self.db = db
        self.publisher = publisher

    async def publish(
        self,
        post_id: uuid.UUID,
    ) -> Post:

        result = await self.db.execute(
            select(Post).where(
                Post.id == post_id
            )
        )

        post = result.scalar_one_or_none()

        if post is None:
            raise ValueError(
                f"Post {post_id} not found"
            )

        # Idempotency protection.
        if post.status == "published":
            return post

        if post.status not in {
            "scheduled",
            "approved",
        }:
            raise ValueError(
                f"Cannot publish post in "
                f"'{post.status}' state"
            )

        try:
            post.status = "publishing"

            await self.db.commit()

            publish_result = (
                await self.publisher.publish(post)
            )

            post.external_post_id = (
                publish_result.external_post_id
            )

            post.published_at = (
                datetime.now(timezone.utc)
            )

            post.status = "published"
            post.failure_reason = None

            await self.db.commit()
            await self.db.refresh(post)

            return post

        except Exception as exc:

            await self.db.rollback()

            result = await self.db.execute(
                select(Post).where(
                    Post.id == post_id
                )
            )

            post = result.scalar_one()

            post.status = "failed"
            post.failure_reason = str(exc)

            await self.db.commit()

            raise