import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

from app.config import settings

from datetime import datetime, timedelta, timezone

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.social_account import SocialAccount
from app.db.models.user import User
from app.db.session import get_db
from app.auth.jwt import create_access_token
router = APIRouter()


@router.get("/linkedin")
async def linkedin_login():
    state = secrets.token_urlsafe(32)

    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "state": state,
        "scope": "openid profile w_member_social",
    }

    print("AUTH PARAMS:", params)   # <-- ADD HERE

    authorization_url = (
        "https://www.linkedin.com/oauth/v2/authorization?"
        + urlencode(params)
    )

    response = RedirectResponse(
        url=authorization_url
    )

    response.set_cookie(
        key="linkedin_oauth_state",
        value=state,
        httponly=True,
        max_age=600,
        samesite="lax",
    )

    return response


@router.get("/linkedin/callback")
async def linkedin_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if error:
        raise HTTPException(
            status_code=400,
            detail={
                "error": error,
                "description": error_description,
            },
        )

    saved_state = request.cookies.get(
        "linkedin_oauth_state"
    )

    if not state or not saved_state:
        raise HTTPException(
            status_code=400,
            detail="Missing OAuth state",
        )

    if not secrets.compare_digest(
        state,
        saved_state,
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth state",
        )

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Missing authorization code",
        )

    token_url = (
        "https://www.linkedin.com/oauth/v2/accessToken"
    )

    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "client_secret": settings.LINKEDIN_CLIENT_SECRET,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
    }

    print("TOKEN DATA:", {
        "grant_type": token_data["grant_type"],
        "client_id": token_data["client_id"],
        "redirect_uri": token_data["redirect_uri"],
    })  # <-- ADD HERE (don't print the secret)

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            token_url,
            data=token_data,
        )

    if token_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "LinkedIn token exchange failed",
                "linkedin_response": token_response.text,
            },
        )

    token = token_response.json()

    access_token = token.get("access_token")
    expires_in = token.get("expires_in")

    if not access_token:
        raise HTTPException(
            status_code=400,
            detail="LinkedIn did not return an access token",
        )

    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={
                "Authorization": f"Bearer {access_token}",
            },
        )

    if user_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Failed to retrieve LinkedIn user",
                "linkedin_response": user_response.text,
            },
        )

    user = user_response.json()

    platform_user_id = user.get("sub")
    display_name = user.get("name")
    email = user.get("email")

    if not platform_user_id:
        raise HTTPException(
            status_code=400,
            detail="LinkedIn did not return a member ID",
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="LinkedIn did not return an email address",
        )

    token_expires_at = None

    if expires_in:
        token_expires_at = (
            datetime.now(timezone.utc)
            + timedelta(seconds=int(expires_in))
        )

    user_result = await db.execute(
        select(User).where(User.email == email)
    )

    app_user = user_result.scalar_one_or_none()

    if app_user is None:
        app_user = User(
            email=email,
            name=display_name,
        )
        db.add(app_user)
        await db.flush()
    else:
        app_user.name = display_name

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.platform == "linkedin",
            SocialAccount.platform_user_id == platform_user_id,
        )
    )

    social_account = result.scalar_one_or_none()

    if social_account:
        # Account already connected — update its credentials
        social_account.display_name = display_name
        social_account.access_token = access_token
        social_account.token_expires_at = token_expires_at
        social_account.user_id = app_user.id
        social_account.status = "active"

    else:
        # First time connecting this LinkedIn account
        social_account = SocialAccount(
            user_id=app_user.id,
            platform="linkedin",
            platform_user_id=platform_user_id,
            display_name=display_name,
            access_token=access_token,
            token_expires_at=token_expires_at,
            status="active",
        )

        db.add(social_account)

    await db.commit()
    await db.refresh(social_account)

    jwt_token = create_access_token(app_user.id)

    params = urlencode(
        {
            "token": jwt_token,
        }
    )

    frontend_redirect = (
        f"{settings.FRONTEND_URL}/auth/callback?{params}"
    )

    response = RedirectResponse(frontend_redirect)

    response.delete_cookie("linkedin_oauth_state")

    return response

@router.get("/debug-config")
async def debug_config():
    return {
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
    }