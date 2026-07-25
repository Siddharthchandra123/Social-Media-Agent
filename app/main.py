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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ],
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