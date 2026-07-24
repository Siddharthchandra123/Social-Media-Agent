import asyncio
import uuid

from app.db.session import AsyncSessionLocal
from app.publishing.mock import MockPublisher
from app.publishing.service import PublishingService
from app.workers.celery_app import celery_app


async def _publish_post(
    post_id: str,
):
    async with AsyncSessionLocal() as db:

        publisher = MockPublisher()

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
    try:
        asyncio.run(
            _publish_post(post_id)
        )

    except Exception as exc:
        raise self.retry(
            exc=exc,
            countdown=30,
        )