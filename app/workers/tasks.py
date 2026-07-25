import asyncio
import uuid
from sqlalchemy import select

from app.db.session import AsyncSessionLocal, engine
from app.publishing.service import PublishingService
from app.workers.celery_app import celery_app
from app.db.models.social_account import SocialAccount
from app.publishing.linkedin import LinkedInPublisher


async def _publish_post(
    post_id: str,
):
    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(SocialAccount).where(
                SocialAccount.platform == "linkedin",
                SocialAccount.status == "active",
            )
        )

        social_account = result.scalars().first()

        if social_account is None:
            raise RuntimeError(
                "No active LinkedIn account connected"
            )

        publisher = LinkedInPublisher(
            access_token=social_account.access_token,
            platform_user_id=social_account.platform_user_id,
        )

        service = PublishingService(
            db=db,
            publisher=publisher,
        )

        await service.publish(
            uuid.UUID(post_id)
        )


@celery_app.task(
    name="publish_post",
    bind=True,
    max_retries=3,
)


def publish_post(
    self,
    post_id: str,
):
    async def runner():
        try:
            await _publish_post(post_id)
        finally:
            await engine.dispose()

    try:
        asyncio.run(runner())

    except Exception as exc:
        raise self.retry(
            exc=exc,
            countdown=30,
        )