from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(
        f"Starting {settings.APP_NAME}"
    )

    yield

    print(
        f"Stopping {settings.APP_NAME}"
    )


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description=(
        "AI-powered social media content generation "
        "and optimization backend."
    ),
    lifespan=lifespan,
)

allowed_origins = [
    origin.strip()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    api_router,
    prefix=settings.API_V1_PREFIX,
)


@app.get("/")
async def root():

    return {
        "service": settings.APP_NAME,
        "docs": "/docs",
        "health": "/api/v1/health",
    }