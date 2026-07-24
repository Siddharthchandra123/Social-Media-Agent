from fastapi import APIRouter

from app.api.routes import (
    content,
    health,
    posts,
    scheduling,
)


api_router = APIRouter()


api_router.include_router(
    health.router,
    prefix="/health",
    tags=["Health"],
)


api_router.include_router(
    content.router,
    prefix="/content",
    tags=["Content Agent"],
)


api_router.include_router(
    posts.router,
    prefix="/posts",
    tags=["Posts"],
)


api_router.include_router(
    scheduling.router,
    prefix="/scheduling",
    tags=["Scheduling"],
)