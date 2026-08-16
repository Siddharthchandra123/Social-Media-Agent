"""
X (Twitter) API v2 publishing integration.

Uses OAuth 2.0 Authorization Code with PKCE user tokens
(tweet.read, users.read, tweet.write, offline.access).

POST https://api.x.com/2/tweets  ->  create a post (text only)

Media note: the X API v2 "create post" endpoint accepts text only.
Uploading images/videos still requires the v1.1 media upload endpoint
(https://upload.twitter.com/1.1/media/upload.json), which is outside
the current OAuth 2.0 scope setup and requires the app access level to
support it. Text-only publishing is the supported path for this
integration; the `XPublisher` is structured so a media step can be
added later (e.g. `_attach_media`) without rewriting the flow.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx

from app.config import settings
from app.db.models.post import Post
from app.publishing.base import PublishResult, SocialPublisher
from app.security.encryption import token_encryptor

logger = logging.getLogger(__name__)

MAX_TWEET_LENGTH = 280
REQUEST_TIMEOUT_SECONDS = 30.0

TOKEN_URL = "https://api.x.com/2/oauth2/token"
CREATE_TWEET_URL = "https://api.x.com/2/tweets"
USERS_ME_URL = "https://api.x.com/2/users/me"

REQUIRED_SCOPES = "tweet.read users.read tweet.write offline.access"


class XPostValidationError(Exception):
    """User-facing error for content that X will not accept."""


class XTokenError(Exception):
    """The X connection is expired and can no longer be used."""


class XTokenRefreshError(Exception):
    """X rejected the refresh-token request."""


class XPublishError(Exception):
    """X rejected the publish request."""


# ---------------------------------------------------------------------------
# Content normalization
# ---------------------------------------------------------------------------

def build_tweet_text(post: Post) -> str:
    """
    Build a single X post from the post model parts.

    Normalization:
    - strips leading/trailing whitespace per part
    - drops empty parts
    - joins parts with a blank line (preserves readable structure)
    - joins hashtags with single spaces
    """
    parts = [
        part.strip()
        for part in [post.hook, post.caption, post.cta]
        if part and part.strip()
    ]

    hashtags = " ".join(
        tag.strip() for tag in (post.hashtags or []) if tag and tag.strip()
    )
    if hashtags:
        parts.append(hashtags)

    return "\n\n".join(parts)


def validate_tweet_text(text: str) -> None:
    """
    Validate post text against X constraints.

    Raises XPostValidationError (never silently truncates user content).
    """
    stripped = text.strip()
    if not stripped:
        raise XPostValidationError(
            "The post has no visible text. Add a hook, caption, or CTA "
            "before publishing to X."
        )
    if len(text) > MAX_TWEET_LENGTH:
        raise XPostValidationError(
            f"This post is {len(text)} characters, but X allows at most "
            f"{MAX_TWEET_LENGTH}. Shorten the post before publishing to X."
        )


# ---------------------------------------------------------------------------
# Token refresh
# ---------------------------------------------------------------------------

def _token_auth() -> httpx.BasicAuth | None:
    """Basic auth header only for confidential clients (secret configured)."""
    if settings.X_CLIENT_SECRET:
        return httpx.BasicAuth(settings.X_CLIENT_ID, settings.X_CLIENT_SECRET)
    return None


def _token_headers() -> dict[str, str]:
    return {"Content-Type": "application/x-www-form-urlencoded"}


async def refresh_x_access_token(
    refresh_token: str,
) -> tuple[str, str | None, datetime | None]:
    """
    Exchange a refresh token for a fresh access token.

    Returns (access_token, refresh_token, expires_at).
    Raises XTokenRefreshError with a user-safe message.
    """
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": settings.X_CLIENT_ID,
    }

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                TOKEN_URL,
                data=data,
                headers=_token_headers(),
                auth=_token_auth(),
            )
    except httpx.HTTPError as exc:
        logger.warning("X token refresh request failed: %s", exc)
        raise XTokenRefreshError(
            "Could not reach X to refresh the connection."
        ) from exc

    if response.status_code != 200:
        logger.warning(
            "X token refresh rejected: HTTP %s", response.status_code
        )
        raise XTokenRefreshError(
            "X rejected the refresh request. Reconnect the X account."
        )

    token_json = response.json()
    access_token = token_json.get("access_token")
    if not access_token:
        raise XTokenRefreshError(
            "X did not return a new access token. Reconnect the X account."
        )

    expires_in = token_json.get("expires_in")
    expires_at = (
        datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
        if expires_in
        else None
    )

    return access_token, token_json.get("refresh_token"), expires_at


_x_refresh_locks: dict[str, asyncio.Lock] = {}


def _refresh_lock(account_id: str) -> asyncio.Lock:
    """Per-account lock so concurrent publishes do not refresh in parallel."""
    if account_id not in _x_refresh_locks:
        _x_refresh_locks[account_id] = asyncio.Lock()
    return _x_refresh_locks[account_id]


async def obtain_valid_x_token(
    db,
    account,
) -> str:
    """
    Return a valid (decrypted) access token for an X SocialAccount,
    refreshing and persisting it when expired.

    Concurrent refreshes for the same account are serialized with a
    per-account asyncio lock.
    """
    async with _refresh_lock(str(account.id)):
        access_token = (
            token_encryptor.decrypt(account.access_token)
            or account.access_token
        )

        if account.token_expires_at and account.token_expires_at <= datetime.now(
            timezone.utc
        ):
            if not account.refresh_token:
                raise XTokenError(
                    "Your X connection has expired. Reconnect the X account "
                    "from Connected Accounts."
                )

            refresh_token = (
                token_encryptor.decrypt(account.refresh_token)
                or account.refresh_token
            )

            try:
                new_access, new_refresh, expires_at = (
                    await refresh_x_access_token(refresh_token)
                )
            except XTokenRefreshError as exc:
                raise XTokenError(
                    "Your X connection could not be refreshed. Reconnect the "
                    "X account from Connected Accounts."
                ) from exc

            account.access_token = token_encryptor.encrypt(new_access)
            account.refresh_token = (
                token_encryptor.encrypt(new_refresh) if new_refresh else None
            )
            account.token_expires_at = expires_at
            await db.commit()

            return new_access

        return access_token


# ---------------------------------------------------------------------------
# Publisher
# ---------------------------------------------------------------------------

def _friendly_api_error(response: httpx.Response) -> str:
    """Map an X API error response to a user-safe message."""
    try:
        body = response.json()
        detail = body.get("detail") or ""
        title = body.get("title") or ""
    except ValueError:
        body, detail, title = {}, "", ""

    if response.status_code == 429:
        return (
            "X is rate-limiting requests right now. Wait a few minutes and "
            "try again."
        )

    if response.status_code in (401, 403):
        if any(
            word in (detail + " " + title).lower()
            for word in ("scope", "permission", "forbidden")
        ):
            return (
                "This X app does not have permission to post. Grant the "
                "tweet.write scope when connecting, or ask the workspace "
                "owner to update the X app."
            )
        return (
            "X rejected this request. Reconnect the X account from Connected "
            "Accounts and try again."
        )

    if response.status_code == 400:
        message = detail or title or "invalid request"
        if any(word in message.lower() for word in ("duplicate", "already")):
            return (
                "X flagged this post as a duplicate. Change the text and try "
                "again."
            )
        if any(
            word in message.lower()
            for word in ("length", "too long", "character")
        ):
            return (
                "X rejected the post because it is too long. Shorten it to "
                f"{MAX_TWEET_LENGTH} characters or fewer."
            )
        return f"X rejected the post: {message}"

    message = detail or title or response.text[:200]
    return f"X publishing failed: {message}"


class XPublisher(SocialPublisher):

    def __init__(
        self,
        access_token: str,
        platform_user_id: str,
        username: str | None = None,
    ):
        self.access_token = access_token
        self.platform_user_id = platform_user_id
        self.username = username

    async def publish(
        self,
        post: Post,
    ) -> PublishResult:
        text = build_tweet_text(post)
        validate_tweet_text(text)

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
        payload = {"text": text}

        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                response = await client.post(
                    CREATE_TWEET_URL,
                    headers=headers,
                    json=payload,
                )
        except httpx.HTTPError as exc:
            logger.warning("X publish request failed: %s", exc)
            raise RuntimeError(
                "Could not connect to X. The X API may be unavailable right "
                "now. Try again in a moment."
            ) from exc

        if response.status_code != 201:
            raise XPublishError(_friendly_api_error(response))

        data = response.json().get("data", {})
        external_post_id = data.get("id")

        if not external_post_id:
            raise RuntimeError(
                "X returned success but no post ID."
            )

        if self.username:
            external_url = (
                f"https://x.com/{self.username}/status/{external_post_id}"
            )
        else:
            external_url = f"https://x.com/i/status/{external_post_id}"

        return PublishResult(
            external_post_id=external_post_id,
            external_url=external_url,
        )