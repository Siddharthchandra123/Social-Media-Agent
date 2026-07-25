from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.workers.dispatcher import TaskDispatcher
from app.dependencies import get_post_service
from app.schemas.post import (
    CreatePostRequest,
    PostResponse,
    SchedulePostRequest,
)
from app.services.post_service import (
    CandidateNotFoundError,
    InvalidPostStateError,
    PostNotFoundError,
    PostService,
)


router = APIRouter()


@router.post(
    "",
    response_model=PostResponse,
    status_code=201,
)
async def create_post(
    request: CreatePostRequest,
    service: PostService = Depends(
        get_post_service
    ),
):
    try:
        return await service.create_from_candidate(
            request.candidate_id
        )

    except CandidateNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.get(
    "/{post_id}",
    response_model=PostResponse,
)
async def get_post(
    post_id: UUID,
    service: PostService = Depends(
        get_post_service
    ),
):
    try:
        return await service.get_post(post_id)

    except PostNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.post(
    "/{post_id}/approve",
    response_model=PostResponse,
)
async def approve_post(
    post_id: UUID,
    service: PostService = Depends(
        get_post_service
    ),
):
    try:
        return await service.approve(post_id)

    except (
        PostNotFoundError,
        InvalidPostStateError,
    ) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post(
    "/{post_id}/publish",
    status_code=202,
)
async def publish_post_now(
    post_id: UUID,
    service: PostService = Depends(
        get_post_service
    ),
):
    try:
        post = await service.get_post(post_id)

        if post.status != "approved":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Post must be approved "
                    "before publishing"
                ),
            )

        TaskDispatcher.publish_now(
            str(post_id)
        )

        return {
            "message": "Post queued for publishing",
            "post_id": str(post_id),
        }

    except PostNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.post(
    "/{post_id}/schedule",
    response_model=PostResponse,
)
async def schedule_post(
    post_id: UUID,
    request: SchedulePostRequest,
    service: PostService = Depends(
        get_post_service
    ),
):
    try:
        return await service.schedule(
            post_id,
            request.scheduled_at,
        )

    except PostNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except (
        InvalidPostStateError,
        ValueError,
    ) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc