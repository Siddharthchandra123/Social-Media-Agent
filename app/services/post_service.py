import uuid
from datetime import datetime, timezone

from datetime import datetime, timezone

from app.publishing.linkedin import LinkedInPublisher
from app.config import settings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.candidate import ContentCandidate
from app.db.models.generation import ContentGeneration
from app.db.models.post import Post


class PostNotFoundError(Exception):
    pass


class CandidateNotFoundError(Exception):
    pass


class InvalidPostStateError(Exception):
    pass


class PostService:

    def __init__(self, db: AsyncSession):
        self.db = db

    # ---------------------------------------------------------
    # CREATE POST FROM AI CANDIDATE
    # ---------------------------------------------------------

    async def create_from_candidate(
        self,
        candidate_id: uuid.UUID,
    ) -> Post:

        result = await self.db.execute(
            select(ContentCandidate).where(
                ContentCandidate.id == candidate_id
            )
        )

        candidate = result.scalar_one_or_none()

        if candidate is None:
            raise CandidateNotFoundError(
                f"Candidate {candidate_id} not found"
            )

        generation_result = await self.db.execute(
            select(ContentGeneration).where(
                ContentGeneration.id
                == candidate.generation_id
            )
        )

        generation = (
            generation_result.scalar_one_or_none()
        )

        if generation is None:
            raise CandidateNotFoundError(
                "Candidate generation not found"
            )

        post = Post(
            candidate_id=candidate.id,
            platform=generation.platform,
            hook=candidate.hook,
            caption=candidate.caption,
            cta=candidate.cta,
            hashtags=candidate.hashtags,
            status="draft",
        )

        self.db.add(post)

        await self.db.commit()
        await self.db.refresh(post)

        # IMPORTANT:
        # Do NOT dispatch to Celery here.
        # This post is only a draft.

        return post

    # ---------------------------------------------------------
    # LIST POSTS
    # ---------------------------------------------------------

    async def list_posts(
        self,
        limit: int = 100,
    ) -> list[Post]:

        result = await self.db.execute(
            select(Post)
            .order_by(Post.created_at.desc())
            .limit(limit)
        )

        return list(
            result.scalars().all()
        )

    # ---------------------------------------------------------
    # GET POST
    # ---------------------------------------------------------

    async def get_post(
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
            raise PostNotFoundError(
                f"Post {post_id} not found"
            )

        return post

    # ---------------------------------------------------------
    # APPROVE POST
    # ---------------------------------------------------------

    async def approve(
        self,
        post_id: uuid.UUID,
    ) -> Post:

        post = await self.get_post(post_id)

        if post.status != "draft":
            raise InvalidPostStateError(
                f"Cannot approve post in "
                f"'{post.status}' state"
            )

        post.status = "approved"

        await self.db.commit()
        await self.db.refresh(post)

        return post

    # ---------------------------------------------------------
    # SCHEDULE POST
    # ---------------------------------------------------------

    async def schedule(
        self,
        post_id: uuid.UUID,
        scheduled_at: datetime,
    ) -> Post:

        post = await self.get_post(post_id)

        if post.status != "approved":
            raise InvalidPostStateError(
                "Only approved posts can be scheduled"
            )

        if scheduled_at.tzinfo is None:
            raise ValueError(
                "scheduled_at must include timezone"
            )

        if scheduled_at <= datetime.now(timezone.utc):
            raise ValueError(
                "scheduled_at must be in the future"
            )

        post.scheduled_at = scheduled_at
        post.status = "scheduled"

        await self.db.commit()
        await self.db.refresh(post)
        
        return post
    
    async def publish_now(
    self,
    post_id: uuid.UUID,
):
        post = await self.get_post(post_id)

        if post.status != "approved":
            raise InvalidPostStateError(
                "Post must be approved before publishing"
            )

        if post.platform != "linkedin":
            raise InvalidPostStateError(
                f"Publishing for '{post.platform}' "
                "is not implemented yet"
            )

        publisher = LinkedInPublisher(
            access_token=settings.LINKEDIN_ACCESS_TOKEN,
            platform_user_id=settings.LINKEDIN_PLATFORM_USER_ID,
        )

        post.status = "publishing"

        await self.db.commit()
        await self.db.refresh(post)

        try:
            result = await publisher.publish(post)

            post.status = "published"
            post.published_at = datetime.now(
                timezone.utc
            )

            post.external_post_id = (
                result.external_post_id
            )

            post.failure_reason = None

            await self.db.commit()
            await self.db.refresh(post)

            return post

        except Exception as exc:

            post.status = "failed"
            post.failure_reason = str(exc)

            await self.db.commit()
            await self.db.refresh(post)

            raise