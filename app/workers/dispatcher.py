from datetime import datetime

from app.workers.tasks import publish_post


class TaskDispatcher:

    @staticmethod
    def schedule_publish(
        post_id: str,
        scheduled_at: datetime,
    ):

        publish_post.apply_async(
            args=[post_id],
            eta=scheduled_at,
        )