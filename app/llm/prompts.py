from app.schemas.content import (
    ContentGenerationRequest,
    PostCandidateGenerated,
)


CONTENT_GENERATION_SYSTEM_PROMPT = """
You are the Content Generation Agent for an AI-powered
social media management platform.

Your job is to generate high-quality social media posts
optimized for the requested platform, audience, objective
and tone.

Rules:

1. Generate exactly three substantially different candidates.
2. Every candidate must have a strong hook.
3. Adapt the writing style to the social platform.
4. Do not fabricate facts, statistics, achievements,
   testimonials, partnerships or events.
5. Do not claim the user or company did something unless
   that information appears in the supplied topic.
6. Avoid generic AI marketing language.
7. Avoid excessive emojis.
8. Use relevant hashtags rather than hashtag stuffing.
9. Include a natural call to action.
10. Make each candidate meaningfully different.
11. Do not score the candidates.
"""


CONTENT_EVALUATION_SYSTEM_PROMPT = """
You are the Content Evaluation Agent for an AI-powered
social media platform.

Evaluate the supplied social media candidate.

Score each category independently from 0 to 100:

hook_score:
How effectively the opening captures attention.

relevance_score:
How relevant the content is to the supplied topic,
objective and audience.

brand_score:
How well the content follows the requested tone.

readability_score:
How clear, concise and easy to read the post is.

cta_score:
How effectively the call to action encourages the
desired engagement.

platform_score:
How appropriate the content is for the target
social media platform.

Do not calculate a final score.

Return an objective short explanation for the evaluation.
"""


def build_generation_prompt(
    request: ContentGenerationRequest,
    post_max_length: int | None = None,
) -> str:

    length_instruction = ""
    if post_max_length is not None:
        length_instruction = f"""

Length constraint (CRITICAL for {request.platform.value}):
The final post — hook + caption + CTA + hashtags combined — must be
at most {post_max_length} characters. Count characters precisely and
make every candidate fit within this limit. Prefer trimming the caption
and hashtags over cutting the hook or CTA.
"""

    return f"""
Create three social media post candidates.

Platform:
{request.platform.value}

Topic:
{request.topic}

Objective:
{request.objective}

Tone:
{request.tone}

Target audience:
{request.audience}

Generate exactly three substantially different approaches.
{length_instruction}"""


def build_evaluation_prompt(
    request: ContentGenerationRequest,
    candidate: PostCandidateGenerated,
) -> str:

    return f"""
Evaluate this social media post.

TARGET

Platform:
{request.platform.value}

Topic:
{request.topic}

Objective:
{request.objective}

Tone:
{request.tone}

Audience:
{request.audience}


POST

Hook:
{candidate.hook}

Caption:
{candidate.caption}

CTA:
{candidate.cta}

Hashtags:
{" ".join(candidate.hashtags)}

Content type:
{candidate.content_type}

Suggested media:
{candidate.suggested_media}
"""