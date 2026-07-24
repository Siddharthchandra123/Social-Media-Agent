from celery import Celery

from app.config import settings


celery_app = Celery(
    "social_media_agent",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.workers.tasks",
    ],
)


celery_app.conf.update(
    timezone="UTC",
    enable_utc=True,

    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    task_track_started=True,

    broker_connection_retry_on_startup=True,
)