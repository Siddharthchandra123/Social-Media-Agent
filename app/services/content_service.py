import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.content_agent import ContentAgent
from app.db.models.candidate import ContentCandidate
from app.db.models.generation import ContentGeneration
from app.schemas.content import ContentGenerationRequest


class GenerationNotFoundError(Exception):
    pass


class ContentService:

    def __init__(
        self,
        db: AsyncSession,
        content_agent: ContentAgent,
    ):
        self.db = db
        self.content_agent = content_agent

    async def generate_content(
        self,
        request: ContentGenerationRequest,
        user_id: uuid.UUID,
    ):

        generation = ContentGeneration(
            user_id=user_id,
            platform=request.platform.value,
            topic=request.topic,
            objective=request.objective,
            tone=request.tone,
            audience=request.audience,
            status="processing",
        )

        self.db.add(generation)

        await self.db.flush()

        try:
            evaluated_candidates = (
                await self.content_agent.generate(request)
            )

            candidate_models = []

            for result in evaluated_candidates:

                candidate = ContentCandidate(
                    generation_id=generation.id,

                    hook=result.candidate.hook,
                    caption=result.candidate.caption,
                    cta=result.candidate.cta,

                    hashtags=result.candidate.hashtags,

                    content_type=(
                        result.candidate.content_type
                    ),

                    suggested_media=(
                        result.candidate.suggested_media
                    ),

                    hook_score=(
                        result.evaluation.hook_score
                    ),

                    relevance_score=(
                        result.evaluation.relevance_score
                    ),

                    brand_score=(
                        result.evaluation.brand_score
                    ),

                    readability_score=(
                        result.evaluation.readability_score
                    ),

                    cta_score=(
                        result.evaluation.cta_score
                    ),

                    platform_score=(
                        result.evaluation.platform_score
                    ),

                    total_score=result.total_score,
                    rank=result.rank,

                    evaluation_explanation=(
                        result.evaluation.explanation
                    ),
                )

                self.db.add(candidate)

                candidate_models.append(candidate)

            await self.db.flush()

            winner = candidate_models[0]

            generation.recommended_candidate_id = (
                winner.id
            )

            generation.status = "completed"

            await self.db.commit()

        except Exception:
            await self.db.rollback()
            raise

        return await self.get_generation(
            generation.id,
            user_id,
        )

    async def get_generation(
        self,
        generation_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> ContentGeneration:

        statement = (
            select(ContentGeneration)
            .options(
                selectinload(ContentGeneration.candidates)
            )
            .where(
                ContentGeneration.id == generation_id,
                ContentGeneration.user_id == user_id,
            )
        )

        result = await self.db.execute(statement)

        generation = result.scalar_one_or_none()

        if not generation:
            raise GenerationNotFoundError(
                f"Generation {generation_id} not found"
            )

        generation.candidates.sort(
            key=lambda candidate: candidate.rank
        )

        return generation

    async def list_generations(
        self,
        user_id: uuid.UUID,
        limit: int = 20,
    ):

        statement = (
            select(ContentGeneration)
            .where(ContentGeneration.user_id == user_id)
            .options(
                selectinload(
                    ContentGeneration.candidates
                )
            )
            .order_by(
                ContentGeneration.created_at.desc()
            )
            .limit(limit)
        )

        result = await self.db.execute(statement)

        generations = list(
            result.scalars().unique().all()
        )

        for generation in generations:
            generation.candidates.sort(
                key=lambda candidate: candidate.rank
            )

        return generations