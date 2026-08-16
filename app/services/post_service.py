import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.candidate import ContentCandidate
from app.db.models.generation import ContentGeneration
from app.db.models.post import Post
from app.db.models.social_account import SocialAccount
from app.publishing.facebook import FacebookPublisher
from app.publishing.instagram import InstagramPublisher
from app.publishing.linkedin import LinkedInPublisher
from app.publishing.x import (
    XPublisher,
    X_POST_MAX_LENGTH_KEY,
    XPublishError,
    get_effective_x_post_limit,
    obtain_valid_x_token,
)
from app.security.encryption import token_encryptor


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
        user_id: uuid.UUID,
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
            user_id=user_id,
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
        user_id: uuid.UUID,
        limit: int = 100,
    ) -> list[Post]:

        result = await self.db.execute(
            select(Post)
            .where(Post.user_id == user_id)
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
        user_id: uuid.UUID,
    ) -> Post:

        result = await self.db.execute(
            select(Post).where(
                Post.id == post_id,
                Post.user_id == user_id,
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
        user_id: uuid.UUID,
    ) -> Post:

        post = await self.get_post(
            post_id,
            user_id,
        )

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
        user_id: uuid.UUID,
    ) -> Post:

        post = await self.get_post(
            post_id,
            user_id,
        )

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
        user_id: uuid.UUID,
    ) -> Post:
        
        post = await self.get_post(
            post_id,
            user_id,
        )

        if post.status != "approved":
            raise InvalidPostStateError(
                "Post must be approved before publishing"
            )

        if post.platform not in ["linkedin", "facebook", "instagram", "x"]:
            raise InvalidPostStateError(
                f"Publishing for {post.platform} "
                "is not implemented yet"
            )

        # Find connected account
        result = await self.db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == post.platform,
                SocialAccount.status == "active",
            )
        )

        social_account = (
            result.scalars().first()
        )

        if not social_account:
            raise InvalidPostStateError(
                f"No active {post.platform} account connected. "
                f"Connect {post.platform} first."
            )

        if not social_account.access_token:
            raise InvalidPostStateError(
                "Connected account has no access token."
            )

        if not social_account.platform_user_id:
            raise InvalidPostStateError(
                "Connected account has no platform ID."
            )

        decrypted_token = token_encryptor.decrypt(social_account.access_token) or social_account.access_token

        if post.platform == "linkedin":
            publisher = LinkedInPublisher(
                access_token=decrypted_token,
                platform_user_id=social_account.platform_user_id,
            )
        elif post.platform == "facebook":
            publisher = FacebookPublisher(
                page_access_token=decrypted_token,
                page_id=social_account.platform_user_id,
            )
        elif post.platform == "instagram":
            publisher = InstagramPublisher(
                access_token=decrypted_token,
                instagram_business_id=social_account.platform_user_id,
            )
        elif post.platform == "x":
            valid_token = await obtain_valid_x_token(
                self.db,
                social_account,
            )
            publisher = XPublisher(
                access_token=valid_token,
                platform_user_id=social_account.platform_user_id,
                username=social_account.display_name,
                max_post_length=get_effective_x_post_limit(
                    social_account
                ),
            )
        else:
            raise InvalidPostStateError("Unsupported platform")

        post.status = "publishing"

        await self.db.commit()
        await self.db.refresh(post)

        try:
            publish_result = await publisher.publish(
                post
            )

            post.status = "published"

            post.external_post_id = (
                publish_result.external_post_id
            )

            post.external_url = (
                publish_result.external_url
            )

            post.published_at = datetime.now(
                timezone.utc
            )

            post.failure_reason = None

            await self.db.commit()
            await self.db.refresh(post)

            return post

        except Exception as exc:
            import logging

            logging.exception("PUBLISHING FAILED")

            # If X revealed the account's real post length limit
            # (e.g. a tier-restricted account), remember it so future
            # publishes and AI generations respect it.
            if (
                post.platform == "x"
                and isinstance(exc, XPublishError)
                and exc.detected_limit
            ):
                platform_data = dict(social_account.platform_data or {})
                platform_data[X_POST_MAX_LENGTH_KEY] = (
                    exc.detected_limit
                )
                social_account.platform_data = platform_data

            post.status = "failed"
            post.failure_reason = str(exc)

            await self.db.commit()
            await self.db.refresh(post)

            raise