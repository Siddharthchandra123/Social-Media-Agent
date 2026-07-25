from datetime import datetime

from app.workers.tasks import publish_post


class TaskDispatcher:

    @staticmethod
    def publish_now(
        post_id: str,
    ):
        publish_post.delay(post_id)

    @staticmethod
    def schedule_publish(
        post_id: str,
        scheduled_at: datetime,
    ):

        publish_post.apply_async(
            args=[post_id],
            eta=scheduled_at,
        )