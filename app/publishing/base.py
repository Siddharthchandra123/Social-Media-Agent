from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.db.models.post import Post


@dataclass
class PublishResult:
    external_post_id: str
    external_url: str | None = None


class SocialPublisher(ABC):

    @abstractmethod
    async def publish(
        self,
        post: Post,
    ) -> PublishResult:
        pass