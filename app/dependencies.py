from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.content_agent import ContentAgent
from app.db.session import get_db
from app.llm.gemini_client import GeminiClient
from app.services.content_service import ContentService
from app.services.post_service import PostService

def get_gemini_client() -> GeminiClient:
    """
    Create the Gemini client used by the Content Agent.
    """
    return GeminiClient()


def get_content_agent(
    gemini: GeminiClient = Depends(get_gemini_client),
) -> ContentAgent:
    """
    Create the Content Agent with Gemini injected.
    """
    return ContentAgent(
        gemini=gemini,
    )


def get_content_service(
    db: AsyncSession = Depends(get_db),
    agent: ContentAgent = Depends(get_content_agent),
) -> ContentService:
    """
    Create the Content Service with database
    and Content Agent dependencies.
    """
    return ContentService(
        db=db,
        content_agent=agent,
    )
    
def get_post_service(
    db: AsyncSession = Depends(get_db),
) -> PostService:

    return PostService(db)