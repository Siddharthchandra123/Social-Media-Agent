from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Social Media AI Agent"
    APP_ENV: str = "development"
    DEBUG: bool = True

    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/social_agent"
    )
    FRONTEND_URL: str

    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    REDIS_URL: str = "redis://localhost:6379/0"
    DEFAULT_TIMEZONE: str = "Asia/Kolkata"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000"

    # LinkedIn OAuth
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_REDIRECT_URI: str = (
        "https://social-media-agent-uud2.onrender.com/api/v1/auth/linkedin/callback"
    )
    LINKEDIN_VERSION: str = "202603"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    FACEBOOK_CLIENT_ID: str = ""
    FACEBOOK_CLIENT_SECRET: str = ""
    FACEBOOK_REDIRECT_URI: str = (
        "https://social-media-agent-uud2.onrender.com/api/v1/auth/facebook/callback"
    )

    # Instagram OAuth (shares Meta App credentials or separate if configured)
    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""
    INSTAGRAM_REDIRECT_URI: str = (
        "https://social-media-agent-uud2.onrender.com/api/v1/auth/instagram/callback"
    )

    # X (Twitter) OAuth 2.0 Authorization Code with PKCE
    # Client ID / Secret come from the X Developer Portal
    # (https://developer.x.com -> app -> "Keys and tokens").
    # The Client Secret is only used for the token exchange; the PKCE
    # code_verifier is the primary proof-of-possession for public clients.
    X_CLIENT_ID: str = ""
    X_CLIENT_SECRET: str = ""
    X_REDIRECT_URI: str = (
        "https://social-media-agent-uud2.onrender.com/api/v1/auth/x/callback"
    )
    X_API_BASE: str = "https://api.x.com"
    X_AUTHORIZE_URL: str = "https://x.com/i/oauth2/authorize"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()