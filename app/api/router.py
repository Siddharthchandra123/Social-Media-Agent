from fastapi import APIRouter

from app.api.routes import (
    auth,
    content,
    health,
    posts,
    scheduling,
    workspace,
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


api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
)

api_router.include_router(
    workspace.router,
    prefix="",
    tags=["Workspaces & Brands"],
)