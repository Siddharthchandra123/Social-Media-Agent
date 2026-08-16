from dataclasses import dataclass

from app.llm.gemini_client import GeminiClient
from app.llm.prompts import (
    CONTENT_EVALUATION_SYSTEM_PROMPT,
    CONTENT_GENERATION_SYSTEM_PROMPT,
    build_evaluation_prompt,
    build_generation_prompt,
)
from app.schemas.content import (
    ContentEvaluation,
    ContentGenerationRequest,
    GeneratedCandidates,
    PostCandidateGenerated,
)


@dataclass
class EvaluatedCandidate:
    candidate: PostCandidateGenerated
    evaluation: ContentEvaluation
    total_score: float
    rank: int = 0


class ContentAgent:

    def __init__(
        self,
        gemini: GeminiClient,
    ):
        self.gemini = gemini

    async def generate(
        self,
        request: ContentGenerationRequest,
        post_max_length: int | None = None,
    ) -> list[EvaluatedCandidate]:

        candidates = await self._generate_candidates(
            request,
            post_max_length=post_max_length,
        )

        evaluated = []

        for candidate in candidates.candidates:

            evaluation = await self._evaluate_candidate(
                request,
                candidate,
            )

            total_score = self._calculate_score(
                evaluation
            )

            evaluated.append(
                EvaluatedCandidate(
                    candidate=candidate,
                    evaluation=evaluation,
                    total_score=total_score,
                )
            )

        evaluated.sort(
            key=lambda item: item.total_score,
            reverse=True,
        )

        for index, item in enumerate(
            evaluated,
            start=1,
        ):
            item.rank = index

        return evaluated

    async def _generate_candidates(
        self,
        request: ContentGenerationRequest,
        post_max_length: int | None = None,
    ) -> GeneratedCandidates:

        prompt = build_generation_prompt(
            request,
            post_max_length=post_max_length,
        )

        return await self.gemini.generate_structured(
            prompt=prompt,
            system_instruction=CONTENT_GENERATION_SYSTEM_PROMPT,
            response_schema=GeneratedCandidates,
            temperature=0.9,
        )

    async def _evaluate_candidate(
        self,
        request: ContentGenerationRequest,
        candidate: PostCandidateGenerated,
    ) -> ContentEvaluation:

        prompt = build_evaluation_prompt(
            request,
            candidate,
        )

        return await self.gemini.generate_structured(
            prompt=prompt,
            system_instruction=CONTENT_EVALUATION_SYSTEM_PROMPT,
            response_schema=ContentEvaluation,
            temperature=0.2,
        )

    @staticmethod
    def _calculate_score(
        evaluation: ContentEvaluation,
    ) -> float:

        score = (
            evaluation.hook_score * 0.20
            + evaluation.relevance_score * 0.20
            + evaluation.brand_score * 0.20
            + evaluation.readability_score * 0.15
            + evaluation.cta_score * 0.10
            + evaluation.platform_score * 0.15
        )

        return round(score, 2)