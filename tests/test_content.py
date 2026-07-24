from app.agents.content_agent import ContentAgent
from app.schemas.content import ContentEvaluation


def test_weighted_score():

    evaluation = ContentEvaluation(
        hook_score=90,
        relevance_score=90,
        brand_score=80,
        readability_score=80,
        cta_score=70,
        platform_score=90,
        explanation="Good candidate.",
    )

    score = ContentAgent._calculate_score(
        evaluation
    )

    expected = (
        90 * 0.20
        + 90 * 0.20
        + 80 * 0.20
        + 80 * 0.15
        + 70 * 0.10
        + 90 * 0.15
    )

    assert score == expected