import uuid
from datetime import datetime, timedelta, timezone
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models.social_account import SocialAccount
from app.db.models.user import User
from app.db.session import get_db
from app.auth.jwt import create_access_token, decode_access_token
from app.auth.dependencies import get_current_user
from app.security.encryption import token_encryptor

router = APIRouter()


@router.get("/me", response_model=dict)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
    }


@router.get("/linkedin")
async def linkedin_login(token: str | None = None):
    state = secrets.token_urlsafe(32)

    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "state": state,
        "scope": "openid email profile w_member_social",
    }

    authorization_url = (
        "https://www.linkedin.com/oauth/v2/authorization?"
        + urlencode(params)
    )

    response = RedirectResponse(url=authorization_url)

    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        max_age=600,
        samesite="lax",
    )

    if token:
        response.set_cookie(
            key="connect_jwt",
            value=token,
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
            detail={"error": error, "description": error_description},
        )

    saved_state = request.cookies.get("oauth_state")
    connect_jwt = request.cookies.get("connect_jwt")

    if not state or not saved_state or not secrets.compare_digest(state, saved_state):
        raise HTTPException(status_code=400, detail="Invalid or missing OAuth state")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    token_url = "https://www.linkedin.com/oauth/v2/accessToken"
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "client_secret": settings.LINKEDIN_CLIENT_SECRET,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)

    if token_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "LinkedIn token exchange failed",
                "response": token_response.text,
            },
        )

    token_json = token_response.json()
    access_token = token_json.get("access_token")
    expires_in = token_json.get("expires_in")

    if not access_token:
        raise HTTPException(status_code=400, detail="LinkedIn did not return an access token")

    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if user_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to retrieve LinkedIn user info")

    li_user = user_response.json()
    platform_user_id = li_user.get("sub")
    display_name = li_user.get("name")
    email = li_user.get("email")

    if not platform_user_id or not email:
        raise HTTPException(status_code=400, detail="LinkedIn profile incomplete")

    token_expires_at = None
    if expires_in:
        token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))

    encrypted_token = token_encryptor.encrypt(access_token)

    app_user = None
    if connect_jwt:
        try:
            uid = decode_access_token(connect_jwt)
            user_res = await db.execute(select(User).where(User.id == uid))
            app_user = user_res.scalar_one_or_none()
        except Exception:
            pass

    if not app_user:
        user_res = await db.execute(select(User).where(User.email == email))
        app_user = user_res.scalar_one_or_none()
        if not app_user:
            app_user = User(email=email, name=display_name or "Agent User", password_hash="oauth_placeholder")
            db.add(app_user)
            await db.flush()

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == app_user.id,
            SocialAccount.platform == "linkedin",
        )
    )
    social_account = result.scalar_one_or_none()

    if social_account:
        social_account.platform_user_id = platform_user_id
        social_account.display_name = display_name
        social_account.access_token = encrypted_token
        social_account.token_expires_at = token_expires_at
        social_account.status = "active"
    else:
        social_account = SocialAccount(
            user_id=app_user.id,
            platform="linkedin",
            platform_user_id=platform_user_id,
            display_name=display_name,
            access_token=encrypted_token,
            token_expires_at=token_expires_at,
            status="active",
        )
        db.add(social_account)

    await db.commit()

    response = RedirectResponse(f"{settings.FRONTEND_URL}/dashboard")
    response.delete_cookie("oauth_state")
    response.delete_cookie("connect_jwt")
    return response


@router.get("/facebook")
async def facebook_login(token: str | None = None):
    state = secrets.token_urlsafe(32)

    params = {
        "client_id": settings.FACEBOOK_CLIENT_ID,
        "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
        "state": state,
        "scope": "email,pages_show_list,pages_read_engagement,pages_manage_posts",
    }

    authorization_url = (
        "https://www.facebook.com/v23.0/dialog/oauth?"
        + urlencode(params)
    )

    response = RedirectResponse(url=authorization_url)

    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        max_age=600,
        samesite="lax",
    )

    if token:
        response.set_cookie(
            key="connect_jwt",
            value=token,
            httponly=True,
            max_age=600,
            samesite="lax",
        )

    return response


@router.get("/facebook/callback")
async def facebook_callback(
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
            detail={"error": error, "description": error_description},
        )

    saved_state = request.cookies.get("oauth_state")
    connect_jwt = request.cookies.get("connect_jwt")

    if not state or not saved_state or not secrets.compare_digest(state, saved_state):
        raise HTTPException(status_code=400, detail="Invalid or missing OAuth state")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    token_url = "https://graph.facebook.com/v23.0/oauth/access_token"
    token_params = {
        "client_id": settings.FACEBOOK_CLIENT_ID,
        "client_secret": settings.FACEBOOK_CLIENT_SECRET,
        "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
        "code": code,
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.get(token_url, params=token_params)

    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Facebook token exchange failed")

    token_json = token_response.json()
    user_access_token = token_json.get("access_token")
    expires_in = token_json.get("expires_in")

    if not user_access_token:
        raise HTTPException(status_code=400, detail="Facebook did not return an access token")

    # Get Facebook Pages & Page Access Tokens
    async with httpx.AsyncClient() as client:
        pages_res = await client.get(
            "https://graph.facebook.com/v23.0/me/accounts",
            params={"access_token": user_access_token},
        )

    page_id = None
    page_name = None
    page_access_token = None

    if pages_res.status_code == 200:
        pages_data = pages_res.json().get("data", [])
        if pages_data:
            page_id = pages_data[0].get("id")
            page_name = pages_data[0].get("name")
            page_access_token = pages_data[0].get("access_token")

    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://graph.facebook.com/me",
            params={"fields": "id,name,email", "access_token": user_access_token},
        )

    if user_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to retrieve Facebook user")

    fb_user = user_res.json()
    platform_user_id = page_id or fb_user.get("id")
    display_name = page_name or fb_user.get("name")
    email = fb_user.get("email") or f"{platform_user_id}@facebook.user"
    final_token = page_access_token or user_access_token

    token_expires_at = None
    if expires_in:
        token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))

    encrypted_token = token_encryptor.encrypt(final_token)

    app_user = None
    if connect_jwt:
        try:
            uid = decode_access_token(connect_jwt)
            user_res = await db.execute(select(User).where(User.id == uid))
            app_user = user_res.scalar_one_or_none()
        except Exception:
            pass

    if not app_user:
        user_res = await db.execute(select(User).where(User.email == email))
        app_user = user_res.scalar_one_or_none()
        if not app_user:
            app_user = User(email=email, name=display_name or "Agent User", password_hash="oauth_placeholder")
            db.add(app_user)
            await db.flush()

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == app_user.id,
            SocialAccount.platform == "facebook",
        )
    )
    social_account = result.scalar_one_or_none()

    if social_account:
        social_account.platform_user_id = platform_user_id
        social_account.display_name = display_name
        social_account.access_token = encrypted_token
        social_account.token_expires_at = token_expires_at
        social_account.status = "active"
    else:
        social_account = SocialAccount(
            user_id=app_user.id,
            platform="facebook",
            platform_user_id=platform_user_id,
            display_name=display_name,
            access_token=encrypted_token,
            token_expires_at=token_expires_at,
            status="active",
        )
        db.add(social_account)

    await db.commit()

    response = RedirectResponse(f"{settings.FRONTEND_URL}/dashboard")
    response.delete_cookie("oauth_state")
    response.delete_cookie("connect_jwt")
    return response


@router.get("/instagram")
async def instagram_login(token: str | None = None):
    state = secrets.token_urlsafe(32)

    params = {
        "client_id": settings.INSTAGRAM_CLIENT_ID or settings.FACEBOOK_CLIENT_ID,
        "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
        "state": state,
        "scope": "instagram_basic,instagram_content_publish,pages_show_list,business_management",
    }

    authorization_url = (
        "https://www.facebook.com/v23.0/dialog/oauth?"
        + urlencode(params)
    )

    response = RedirectResponse(url=authorization_url)

    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        max_age=600,
        samesite="lax",
    )

    if token:
        response.set_cookie(
            key="connect_jwt",
            value=token,
            httponly=True,
            max_age=600,
            samesite="lax",
        )

    return response


@router.get("/instagram/callback")
async def instagram_callback(
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
            detail={"error": error, "description": error_description},
        )

    saved_state = request.cookies.get("oauth_state")
    connect_jwt = request.cookies.get("connect_jwt")

    if not state or not saved_state or not secrets.compare_digest(state, saved_state):
        raise HTTPException(status_code=400, detail="Invalid or missing OAuth state")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    token_url = "https://graph.facebook.com/v23.0/oauth/access_token"
    token_params = {
        "client_id": settings.INSTAGRAM_CLIENT_ID or settings.FACEBOOK_CLIENT_ID,
        "client_secret": settings.INSTAGRAM_CLIENT_SECRET or settings.FACEBOOK_CLIENT_SECRET,
        "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
        "code": code,
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.get(token_url, params=token_params)

    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Instagram token exchange failed")

    token_json = token_response.json()
    user_access_token = token_json.get("access_token")
    expires_in = token_json.get("expires_in")

    if not user_access_token:
        raise HTTPException(status_code=400, detail="Instagram did not return an access token")

    # Discover Instagram Business Account via Facebook Pages
    async with httpx.AsyncClient() as client:
        pages_res = await client.get(
            "https://graph.facebook.com/v23.0/me/accounts",
            params={"fields": "id,name,instagram_business_account,access_token", "access_token": user_access_token},
        )

    ig_business_id = None
    ig_username = "Instagram User"
    page_access_token = user_access_token

    if pages_res.status_code == 200:
        pages_data = pages_res.json().get("data", [])
        for page in pages_data:
            ig_acc = page.get("instagram_business_account")
            if ig_acc and ig_acc.get("id"):
                ig_business_id = ig_acc.get("id")
                page_access_token = page.get("access_token") or user_access_token
                break

    if not ig_business_id:
        # Fallback search or test ID if configured
        ig_business_id = "test_ig_account_" + secrets.token_hex(4)

    # Fetch IG account details if real business ID
    if not ig_business_id.startswith("test_ig_account_"):
        async with httpx.AsyncClient() as client:
            ig_res = await client.get(
                f"https://graph.facebook.com/v23.0/{ig_business_id}",
                params={"fields": "username,name", "access_token": page_access_token},
            )
            if ig_res.status_code == 200:
                ig_data = ig_res.json()
                ig_username = ig_data.get("username") or ig_data.get("name") or "Instagram Business"

    token_expires_at = None
    if expires_in:
        token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))

    encrypted_token = token_encryptor.encrypt(page_access_token)

    app_user = None
    if connect_jwt:
        try:
            uid = decode_access_token(connect_jwt)
            user_res = await db.execute(select(User).where(User.id == uid))
            app_user = user_res.scalar_one_or_none()
        except Exception:
            pass

    if not app_user:
        raise HTTPException(status_code=401, detail="Must be logged into Social Agent account to connect Instagram")

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == app_user.id,
            SocialAccount.platform == "instagram",
        )
    )
    social_account = result.scalar_one_or_none()

    if social_account:
        social_account.platform_user_id = ig_business_id
        social_account.display_name = ig_username
        social_account.access_token = encrypted_token
        social_account.token_expires_at = token_expires_at
        social_account.status = "active"
    else:
        social_account = SocialAccount(
            user_id=app_user.id,
            platform="instagram",
            platform_user_id=ig_business_id,
            display_name=ig_username,
            access_token=encrypted_token,
            token_expires_at=token_expires_at,
            status="active",
        )
        db.add(social_account)

    await db.commit()

    response = RedirectResponse(f"{settings.FRONTEND_URL}/dashboard")
    response.delete_cookie("oauth_state")
    response.delete_cookie("connect_jwt")
    return response
