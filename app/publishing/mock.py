import uuid

from app.db.models.post import Post
from app.publishing.base import (
    PublishResult,
    SocialPublisher,
)


class MockPublisher(SocialPublisher):

    async def publish(
        self,
        post: Post,
    ) -> PublishResult:

        external_id = f"mock_{uuid.uuid4().hex}"

        print(
            "\n"
            "========== MOCK SOCIAL POST ==========\n"
            f"Platform: {post.platform}\n\n"
            f"{post.hook}\n\n"
            f"{post.caption}\n\n"
            f"{post.cta}\n\n"
            f"{' '.join(post.hashtags)}\n"
            "======================================\n"
        )

        return PublishResult(
            external_post_id=external_id,
            external_url=None,
        )