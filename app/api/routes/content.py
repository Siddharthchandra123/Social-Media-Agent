from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.dependencies import get_content_service
from app.auth.dependencies import get_current_user
from app.db.models.user import User
from app.schemas.content import (
    ContentGenerationRequest,
    GenerationResponse,
)
from app.services.content_service import (
    ContentService,
    GenerationNotFoundError,
)

import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/generate",
    response_model=GenerationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_content(
    request: ContentGenerationRequest,
    current_user: User = Depends(get_current_user),
    service: ContentService = Depends(
        get_content_service
    ),
):
    try:
        return await service.generate_content(
            request,
            current_user.id,
        )

    except Exception as exc:

        logger.exception(
            "Content generation failed"
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "CONTENT_GENERATION_FAILED",
                "message": str(exc),
                "exception_type": type(exc).__name__,
            },
        ) from exc
@router.get(
    "/generations/{generation_id}",
    response_model=GenerationResponse,
)
async def get_generation(
    generation_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ContentService = Depends(
        get_content_service
    ),
):

    try:
        return await service.get_generation(
            generation_id,
            current_user.id,
        )

    except GenerationNotFoundError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "GENERATION_NOT_FOUND",
                "message": str(exc),
            },
        ) from exc


@router.get(
    "/generations",
    response_model=list[GenerationResponse],
)
async def list_generations(
    limit: int = Query(...),
    current_user: User = Depends(get_current_user),
    service: ContentService = Depends(
        get_content_service
    ),
):

    return await service.list_generations(
        current_user.id,
        limit,
    )