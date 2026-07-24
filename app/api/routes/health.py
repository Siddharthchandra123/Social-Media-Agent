from fastapi import APIRouter

from app.config import settings


router = APIRouter()


@router.get("")
async def health_check():

    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "0.1.0",
    }