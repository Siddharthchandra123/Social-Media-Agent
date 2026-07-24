from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.dependencies import get_content_service
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
    service: ContentService = Depends(
        get_content_service
    ),
):
    try:
        return await service.generate_content(request)

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
    service: ContentService = Depends(
        get_content_service
    ),
):

    try:
        return await service.get_generation(
            generation_id
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
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    service: ContentService = Depends(
        get_content_service
    ),
):

    return await service.list_generations(limit)