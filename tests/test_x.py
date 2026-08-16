"""
X (Twitter) integration tests.

All X API calls are mocked — no real X credentials are required.
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import httpx
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from starlette.requests import Request

from app.api.routes import auth as auth_routes
from app.auth.jwt import create_access_token
from app.auth.oauth import (
    generate_oauth_state,
    generate_pkce_pair,
    validate_oauth_state,
)
from app.db.models.post import Post
from app.db.models.social_account import SocialAccount
from app.db.models.user import User
from app.main import app
from app.publishing import x as x_module
from app.publishing.base import PublishResult
from app.publishing.x import (
    MAX_TWEET_LENGTH,
    XPublishError,
    XPostValidationError,
    XPublisher,
    XTokenError,
    XTokenRefreshError,
    build_tweet_text,
    get_effective_x_post_limit,
    obtain_valid_x_token,
    refresh_x_access_token,
    validate_tweet_text,
)
from app.security.encryption import token_encryptor


# ---------------------------------------------------------------------------
# Fake httpx plumbing
# ---------------------------------------------------------------------------

class FakeResponse:
    def __init__(self, status_code, json_data=None, text=""):
        self.status_code = status_code
        self._json = json_data
        self.text = text

    def json(self):
        if self._json is None:
            raise ValueError("no json body")
        return self._json


HANDLER = {"fn": None}


class FakeAsyncClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def post(self, url, **kwargs):
        return HANDLER["fn"]("post", url, kwargs)

    async def get(self, url, **kwargs):
        return HANDLER["fn"]("get", url, kwargs)


def make_post(**overrides) -> Post:
    values = {
        "platform": "x",
        "hook": "Hook line",
        "caption": "Caption body",
        "cta": "Follow for more",
        "hashtags": ["#ai", "#marketing"],
    }
    values.update(overrides)
    return Post(**values)


class StubResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value

    def scalar_one(self):
        return self._value

    def scalars(self):
        return self

    def first(self):
        return self._value

    def all(self):
        return [self._value] if self._value is not None else []


class StubDB:
    def __init__(self, user=None, account=None, post=None):
        self.user = user
        self.account = account
        self.post = post
        self.added = []
        self.commits = 0

    def _entity(self, statement):
        if statement.column_descriptions:
            return statement.column_descriptions[0].get("entity")
        return None

    async def execute(self, statement):
        entity = self._entity(statement)
        if entity is User:
            return StubResult(self.user)
        if entity is SocialAccount:
            return StubResult(self.account)
        if entity is Post:
            return StubResult(self.post)
        return StubResult(None)

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.commits += 1

    async def flush(self):
        pass

    async def refresh(self, obj):
        return obj


def make_request(cookies: dict) -> Request:
    cookie_header = "; ".join(f"{k}={v}" for k, v in cookies.items())
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/v1/auth/x/callback",
        "headers": [(b"cookie", cookie_header.encode("latin-1"))],
        "query_string": b"",
        "cookies": cookies,
    }
    return Request(scope)


# ---------------------------------------------------------------------------
# OAuth state / PKCE helpers
# ---------------------------------------------------------------------------

def test_generate_pkce_pair():
    verifier, challenge = generate_pkce_pair()

    assert 43 <= len(verifier) <= 128
    assert verifier == verifier.strip("-_")
    assert len(challenge) == 43

    import base64
    import hashlib

    expected = (
        base64.urlsafe_b64encode(
            hashlib.sha256(verifier.encode("ascii")).digest()
        )
        .rstrip(b"=")
        .decode("ascii")
    )
    assert challenge == expected


def test_pkce_pair_is_random():
    v1, c1 = generate_pkce_pair()
    v2, c2 = generate_pkce_pair()
    assert v1 != v2
    assert c1 != c2


def test_oauth_state_validation():
    state = generate_oauth_state()

    assert validate_oauth_state(state, state) is True
    assert validate_oauth_state("tampered", state) is False
    assert validate_oauth_state(None, state) is False
    assert validate_oauth_state(state, None) is False


# ---------------------------------------------------------------------------
# Content normalization / validation
# ---------------------------------------------------------------------------

def test_build_tweet_text_joins_all_parts():
    post = make_post()
    text = build_tweet_text(post)

    assert post.hook in text
    assert post.caption in text
    assert post.cta in text
    assert "#ai #marketing" in text
    assert text.count("\n\n") == 3


def test_build_tweet_text_skips_empty_parts():
    post = make_post(cta="   ", hashtags=[])
    text = build_tweet_text(post)

    assert post.hook in text
    assert post.caption in text
    assert "   " not in text
    assert text.count("\n\n") == 1


def test_build_tweet_text_strips_whitespace():
    post = make_post(hook="  Leading hook  ", caption="\nCaption pad\n")
    text = build_tweet_text(post)

    assert text.startswith("Leading hook")
    assert not text.startswith("  ")
    assert "Caption pad" in text
    assert not any(part != part.strip() for part in text.split("\n\n"))


def test_validate_tweet_text_ok_at_limit():
    validate_tweet_text("x" * MAX_TWEET_LENGTH)


def test_validate_tweet_text_rejects_empty():
    with pytest.raises(XPostValidationError):
        validate_tweet_text("   \n  ")


def test_validate_tweet_text_rejects_too_long():
    with pytest.raises(XPostValidationError) as exc:
        validate_tweet_text("x" * (MAX_TWEET_LENGTH + 1))
    assert "characters" in str(exc.value)


def test_validate_tweet_text_custom_limit():
    validate_tweet_text("x" * 200, max_length=200)

    with pytest.raises(XPostValidationError) as exc:
        validate_tweet_text("x" * 201, max_length=200)
    assert "200" in str(exc.value)
    assert "201" in str(exc.value)


# ---------------------------------------------------------------------------
# XPublisher
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_publish_success(monkeypatch):
    def handler(method, url, kwargs):
        assert method == "post"
        assert url == "https://api.x.com/2/tweets"
        assert kwargs["headers"]["Authorization"] == "Bearer valid-token"
        assert kwargs["json"]["text"].startswith("Hook line")
        return FakeResponse(201, {"data": {"id": "tweet-123", "text": "ok"}})

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    publisher = XPublisher(
        access_token="valid-token",
        platform_user_id="user-1",
        username="testuser",
    )
    result = await publisher.publish(make_post())

    assert isinstance(result, PublishResult)
    assert result.external_post_id == "tweet-123"
    assert result.external_url == "https://x.com/testuser/status/tweet-123"


@pytest.mark.asyncio
async def test_publish_success_without_username(monkeypatch):
    def handler(method, url, kwargs):
        return FakeResponse(201, {"data": {"id": "tweet-9"}})

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    result = await XPublisher("t", "user-1").publish(make_post())
    assert result.external_url == "https://x.com/i/status/tweet-9"


@pytest.mark.asyncio
async def test_publish_too_long_never_calls_api(monkeypatch):
    called = []

    def handler(method, url, kwargs):
        called.append(url)
        return FakeResponse(201, {"data": {"id": "x"}})

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    post = make_post(hook="h" * (MAX_TWEET_LENGTH + 5))
    with pytest.raises(XPostValidationError):
        await XPublisher("t", "user-1").publish(post)
    assert called == []


@pytest.mark.asyncio
async def test_publish_rate_limited(monkeypatch):
    def handler(method, url, kwargs):
        return FakeResponse(429, {"title": "Too Many Requests"})

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(XPublishError) as exc:
        await XPublisher("t", "user-1").publish(make_post())
    assert "rate-limiting" in str(exc.value)


@pytest.mark.asyncio
async def test_publish_insufficient_scope(monkeypatch):
    def handler(method, url, kwargs):
        return FakeResponse(
            403,
            {
                "title": "Forbidden",
                "detail": "Client is not authorized to perform this action",
            },
        )

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(XPublishError) as exc:
        await XPublisher("t", "user-1").publish(make_post())
    assert "permission" in str(exc.value)


@pytest.mark.asyncio
async def test_publish_duplicate(monkeypatch):
    def handler(method, url, kwargs):
        return FakeResponse(
            400,
            {
                "title": "Invalid Request",
                "detail": "You are not allowed to create a Tweet with duplicate content.",
            },
        )

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(XPublishError) as exc:
        await XPublisher("t", "user-1").publish(make_post())
    assert "duplicate" in str(exc.value)


@pytest.mark.asyncio
async def test_publish_api_unreachable(monkeypatch):
    class BrokenClient(FakeAsyncClient):
        async def post(self, url, **kwargs):
            raise httpx.ConnectError("boom")

    monkeypatch.setattr(x_module.httpx, "AsyncClient", BrokenClient)

    with pytest.raises(RuntimeError) as exc:
        await XPublisher("t", "user-1").publish(make_post())
    assert "Could not connect to X" in str(exc.value)


@pytest.mark.asyncio
async def test_publish_with_custom_max_length(monkeypatch):
    called = []

    def handler(method, url, kwargs):
        called.append(url)
        return FakeResponse(201, {"data": {"id": "t1"}})

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    publisher = XPublisher("t", "user-1", max_post_length=200)

    await publisher.publish(make_post())
    assert called

    post = make_post(hook="h" * 220)
    with pytest.raises(XPostValidationError) as exc:
        await publisher.publish(post)
    assert "200" in str(exc.value)
    assert len(called) == 1  # API never called for the too-long post


def test_detect_length_limit_from_error():
    from app.publishing.x import _friendly_api_error

    response = FakeResponse(
        400,
        {
            "title": "Unprocessable Entity",
            "detail": "Free tier posts are limited to 200 characters",
        },
    )
    message, detected_limit = _friendly_api_error(response)

    assert detected_limit == 200
    assert "200 characters" in message


def test_no_limit_detected_on_other_errors():
    from app.publishing.x import _friendly_api_error

    response = FakeResponse(
        400,
        {"title": "Invalid Request", "detail": "Duplicate content"},
    )
    message, detected_limit = _friendly_api_error(response)

    assert detected_limit is None
    assert "duplicate" in message.lower()


def test_get_effective_x_post_limit_prefers_stored():
    account = SimpleNamespace(platform_data={"x_post_max_length": 200})
    assert get_effective_x_post_limit(account) == 200


def test_get_effective_x_post_limit_falls_back_to_default():
    assert get_effective_x_post_limit(None) == 280
    assert get_effective_x_post_limit(SimpleNamespace(platform_data=None)) == 280
    assert (
        get_effective_x_post_limit(SimpleNamespace(platform_data={"other": 1}))
        == 280
    )


# ---------------------------------------------------------------------------
# Token refresh
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_refresh_x_access_token_success(monkeypatch):
    def handler(method, url, kwargs):
        assert url == "https://api.x.com/2/oauth2/token"
        assert kwargs["data"]["grant_type"] == "refresh_token"
        assert kwargs["data"]["refresh_token"] == "old-refresh"
        return FakeResponse(
            200,
            {
                "access_token": "new-access",
                "refresh_token": "new-refresh",
                "expires_in": 7200,
            },
        )

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    access, refresh, expires_at = await refresh_x_access_token("old-refresh")

    assert access == "new-access"
    assert refresh == "new-refresh"
    assert expires_at is not None
    assert expires_at > datetime.now(timezone.utc)


@pytest.mark.asyncio
async def test_refresh_x_access_token_rejected(monkeypatch):
    def handler(method, url, kwargs):
        return FakeResponse(400, {"error": "invalid_grant"})

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(XTokenRefreshError):
        await refresh_x_access_token("expired-refresh")


@pytest.mark.asyncio
async def test_refresh_x_access_token_unreachable(monkeypatch):
    class BrokenClient(FakeAsyncClient):
        async def post(self, url, **kwargs):
            raise httpx.ConnectError("down")

    monkeypatch.setattr(x_module.httpx, "AsyncClient", BrokenClient)

    with pytest.raises(XTokenRefreshError):
        await refresh_x_access_token("r")


# ---------------------------------------------------------------------------
# obtain_valid_x_token
# ---------------------------------------------------------------------------

def _account(token, refresh=None, expires_at=None):
    return SimpleNamespace(
        id=uuid.uuid4(),
        access_token=token_encryptor.encrypt(token),
        refresh_token=(
            token_encryptor.encrypt(refresh) if refresh else None
        ),
        token_expires_at=expires_at,
    )


@pytest.mark.asyncio
async def test_obtain_valid_token_returns_current(monkeypatch):
    refreshed = []

    def handler(method, url, kwargs):
        refreshed.append(url)
        return FakeResponse(200, {"access_token": "nope"})

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    account = _account(
        "current-token",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db = StubDB()

    token = await obtain_valid_x_token(db, account)

    assert token == "current-token"
    assert refreshed == []
    assert db.commits == 0


@pytest.mark.asyncio
async def test_obtain_valid_token_refreshes_when_expired(monkeypatch):
    def handler(method, url, kwargs):
        assert kwargs["data"]["grant_type"] == "refresh_token"
        return FakeResponse(
            200,
            {
                "access_token": "fresh-access",
                "refresh_token": "fresh-refresh",
                "expires_in": 7200,
            },
        )

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    account = _account(
        "stale-token",
        refresh="stale-refresh",
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )
    db = StubDB()

    token = await obtain_valid_x_token(db, account)

    assert token == "fresh-access"
    assert db.commits == 1
    assert token_encryptor.decrypt(account.access_token) == "fresh-access"
    assert token_encryptor.decrypt(account.refresh_token) == "fresh-refresh"
    assert account.token_expires_at is not None


@pytest.mark.asyncio
async def test_obtain_valid_token_expired_without_refresh():
    account = _account(
        "stale-token",
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )
    db = StubDB()

    with pytest.raises(XTokenError) as exc:
        await obtain_valid_x_token(db, account)
    assert "expired" in str(exc.value).lower()


@pytest.mark.asyncio
async def test_obtain_valid_token_refresh_failure_maps_to_token_error(
    monkeypatch,
):
    def handler(method, url, kwargs):
        return FakeResponse(400, {"error": "invalid_grant"})

    HANDLER["fn"] = handler
    monkeypatch.setattr(x_module.httpx, "AsyncClient", FakeAsyncClient)

    account = _account(
        "stale-token",
        refresh="stale-refresh",
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )

    with pytest.raises(XTokenError) as exc:
        await obtain_valid_x_token(StubDB(), account)
    assert "Reconnect the X account" in str(exc.value)


# ---------------------------------------------------------------------------
# OAuth routes
# ---------------------------------------------------------------------------

client = TestClient(app)


@pytest.fixture
def x_settings(monkeypatch):
    """Pin X OAuth settings so tests are independent of host env vars."""
    from app.config import settings

    monkeypatch.setattr(settings, "X_CLIENT_ID", "test-x-client-id")
    monkeypatch.setattr(settings, "X_CLIENT_SECRET", "test-x-client-secret")
    monkeypatch.setattr(
        settings,
        "X_REDIRECT_URI",
        "http://localhost:8000/api/v1/auth/x/callback",
    )
    return settings


def test_x_login_redirects_with_pkce(x_settings):
    response = client.get("/api/v1/auth/x", follow_redirects=False)

    assert response.status_code == 307
    location = response.headers["location"]
    assert location.startswith("https://x.com/i/oauth2/authorize?")

    from urllib.parse import parse_qs, urlparse

    params = parse_qs(urlparse(location).query)
    assert params["response_type"] == ["code"]
    assert params["client_id"] == ["test-x-client-id"]
    assert params["redirect_uri"] == ["http://localhost:8000/api/v1/auth/x/callback"]
    assert params["code_challenge_method"] == ["S256"]
    assert params["state"]
    assert params["code_challenge"]

    scopes = params["scope"][0].split(" ")
    assert "tweet.write" in scopes
    assert "offline.access" in scopes

    cookies = response.headers.get_list("set-cookie")
    joined = "; ".join(cookies)
    assert "oauth_state=" in joined
    assert "x_code_verifier=" in joined
    assert "HttpOnly" in joined


def _jwt_for(user: User) -> str:
    return create_access_token(user.id)


@pytest.mark.asyncio
async def test_x_callback_full_flow(monkeypatch, x_settings):
    state = generate_oauth_state()
    verifier, challenge = generate_pkce_pair()
    user = User(id=uuid.uuid4(), email="a@b.c", name="A")

    def handler(method, url, kwargs):
        if url == "https://api.x.com/2/oauth2/token":
            assert kwargs["data"]["grant_type"] == "authorization_code"
            assert kwargs["data"]["code_verifier"] == verifier
            assert kwargs["data"]["client_id"] == "test-x-client-id"
            return FakeResponse(
                200,
                {
                    "access_token": "acc-token",
                    "refresh_token": "ref-token",
                    "expires_in": 7200,
                },
            )
        if url == "https://api.x.com/2/users/me":
            return FakeResponse(
                200,
                {"data": {"id": "98765", "username": "testuser", "name": "Test User"}},
            )
        raise AssertionError(f"unexpected url {url}")

    HANDLER["fn"] = handler
    monkeypatch.setattr(auth_routes.httpx, "AsyncClient", FakeAsyncClient)

    db = StubDB(user=user)
    request = make_request(
        {
            "oauth_state": state,
            "x_code_verifier": verifier,
            "connect_jwt": _jwt_for(user),
        }
    )

    response = await auth_routes.x_callback(
        request,
        code="auth-code",
        state=state,
        db=db,
    )

    assert response.status_code == 307
    assert response.headers["location"] == "http://localhost:3000/dashboard"

    assert len(db.added) == 1
    account: SocialAccount = db.added[0]
    assert account.platform == "x"
    assert account.platform_user_id == "98765"
    assert account.display_name == "testuser"
    assert account.status == "active"
    assert token_encryptor.decrypt(account.access_token) == "acc-token"
    assert token_encryptor.decrypt(account.refresh_token) == "ref-token"
    assert account.token_expires_at is not None
    assert db.commits == 1


@pytest.mark.asyncio
async def test_x_callback_upserts_existing_account(monkeypatch, x_settings):
    state = generate_oauth_state()
    verifier, _ = generate_pkce_pair()
    user = User(id=uuid.uuid4(), email="a@b.c", name="A")
    existing = SocialAccount(
        id=uuid.uuid4(),
        user_id=user.id,
        platform="x",
        platform_user_id="old",
        display_name="old",
        access_token="old",
        status="active",
    )

    def handler(method, url, kwargs):
        if url == "https://api.x.com/2/oauth2/token":
            return FakeResponse(200, {"access_token": "new", "expires_in": 3600})
        return FakeResponse(200, {"data": {"id": "999", "username": "newuser"}})

    HANDLER["fn"] = handler
    monkeypatch.setattr(auth_routes.httpx, "AsyncClient", FakeAsyncClient)

    db = StubDB(user=user, account=existing)
    request = make_request(
        {
            "oauth_state": state,
            "x_code_verifier": verifier,
            "connect_jwt": _jwt_for(user),
        }
    )

    await auth_routes.x_callback(request, code="c", state=state, db=db)

    assert db.added == []
    assert existing.platform_user_id == "999"
    assert existing.display_name == "newuser"
    assert token_encryptor.decrypt(existing.access_token) == "new"
    assert existing.status == "active"
    assert db.commits == 1


@pytest.mark.asyncio
async def test_x_callback_authorization_denied():
    with pytest.raises(HTTPException) as exc:
        await auth_routes.x_callback(
            make_request({}),
            error="access_denied",
            error_description="User said no",
            db=StubDB(),
        )
    assert exc.value.status_code == 400
    assert "denied" in str(exc.value.detail["message"])


@pytest.mark.asyncio
async def test_x_callback_rejects_bad_state():
    with pytest.raises(HTTPException) as exc:
        await auth_routes.x_callback(
            make_request({"oauth_state": "real-state"}),
            code="c",
            state="forged-state",
            db=StubDB(),
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_x_callback_rejects_missing_verifier():
    state = generate_oauth_state()
    with pytest.raises(HTTPException) as exc:
        await auth_routes.x_callback(
            make_request({"oauth_state": state}),
            code="c",
            state=state,
            db=StubDB(),
        )
    assert exc.value.status_code == 400
    assert "PKCE" in str(exc.value.detail)


@pytest.mark.asyncio
async def test_x_callback_requires_login(monkeypatch, x_settings):
    state = generate_oauth_state()
    verifier, _ = generate_pkce_pair()

    def handler(method, url, kwargs):
        if url == "https://api.x.com/2/oauth2/token":
            return FakeResponse(200, {"access_token": "acc"})
        return FakeResponse(200, {"data": {"id": "1", "username": "u"}})

    HANDLER["fn"] = handler
    monkeypatch.setattr(auth_routes.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(HTTPException) as exc:
        await auth_routes.x_callback(
            make_request(
                {
                    "oauth_state": state,
                    "x_code_verifier": verifier,
                }
            ),
            code="c",
            state=state,
            db=StubDB(),
        )
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_x_callback_token_exchange_failure(monkeypatch, x_settings):
    state = generate_oauth_state()
    verifier, _ = generate_pkce_pair()

    def handler(method, url, kwargs):
        return FakeResponse(400, {"error": "invalid_request"})

    HANDLER["fn"] = handler
    monkeypatch.setattr(auth_routes.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(HTTPException) as exc:
        await auth_routes.x_callback(
            make_request({"oauth_state": state, "x_code_verifier": verifier}),
            code="bad",
            state=state,
            db=StubDB(),
        )
    assert exc.value.status_code == 400


# ---------------------------------------------------------------------------
# PostService routing
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_post_service_routes_x_to_x_publisher(monkeypatch):
    from app.services import post_service as post_service_module

    user_id = uuid.uuid4()
    account = SocialAccount(
        id=uuid.uuid4(),
        user_id=user_id,
        platform="x",
        platform_user_id="user-42",
        display_name="xuser",
        access_token=token_encryptor.encrypt("tok"),
        status="active",
    )
    post = Post(
        id=uuid.uuid4(),
        user_id=user_id,
        platform="x",
        hook="H",
        caption="C",
        cta="CTA",
        hashtags=["#x"],
        status="approved",
    )

    class FakeXPublisher:
        instances = []

        def __init__(
            self,
            access_token,
            platform_user_id,
            username=None,
            max_post_length=280,
        ):
            self.access_token = access_token
            self.platform_user_id = platform_user_id
            self.username = username
            self.max_post_length = max_post_length
            FakeXPublisher.instances.append(self)

        async def publish(self, post):
            return PublishResult(
                external_post_id="tweet-1",
                external_url="https://x.com/xuser/status/tweet-1",
            )

    monkeypatch.setattr(
        post_service_module, "XPublisher", FakeXPublisher
    )
    monkeypatch.setattr(
        post_service_module,
        "obtain_valid_x_token",
        _fake_valid_token,
    )

    service = post_service_module.PostService(
        db=StubDB(account=account, post=post)
    )

    published = await service.publish_now(post.id, user_id)

    assert FakeXPublisher.instances
    publisher = FakeXPublisher.instances[-1]
    assert publisher.platform_user_id == "user-42"
    assert publisher.username == "xuser"

    assert published.status == "published"
    assert published.external_post_id == "tweet-1"
    assert published.external_url == "https://x.com/xuser/status/tweet-1"


async def _fake_valid_token(db, account):
    return token_encryptor.decrypt(account.access_token)


@pytest.mark.asyncio
async def test_post_service_rejects_x_when_no_account():
    from app.services.post_service import InvalidPostStateError, PostService

    user_id = uuid.uuid4()
    post = Post(
        id=uuid.uuid4(),
        user_id=user_id,
        platform="x",
        hook="H",
        caption="C",
        cta="CTA",
        hashtags=[],
        status="approved",
    )

    db = StubDB(post=post)

    with pytest.raises(InvalidPostStateError) as exc:
        await PostService(db=db).publish_now(post.id, user_id)
    assert "No active x account" in str(exc.value)


# ---------------------------------------------------------------------------
# Adaptive post length limit
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_post_service_persists_detected_limit(monkeypatch):
    from app.services import post_service as post_service_module

    user_id = uuid.uuid4()
    account = SocialAccount(
        id=uuid.uuid4(),
        user_id=user_id,
        platform="x",
        platform_user_id="user-42",
        display_name="xuser",
        access_token=token_encryptor.encrypt("tok"),
        status="active",
    )
    post = Post(
        id=uuid.uuid4(),
        user_id=user_id,
        platform="x",
        hook="H",
        caption="C",
        cta="CTA",
        hashtags=[],
        status="approved",
    )

    class RejectingPublisher:
        def __init__(self, **kwargs):
            pass

        async def publish(self, post):
            raise XPublishError(
                "X limits posts to 200 characters for this account.",
                detected_limit=200,
            )

    monkeypatch.setattr(
        post_service_module, "XPublisher", RejectingPublisher
    )
    monkeypatch.setattr(
        post_service_module,
        "obtain_valid_x_token",
        _fake_valid_token,
    )

    service = post_service_module.PostService(
        db=StubDB(account=account, post=post)
    )

    with pytest.raises(XPublishError):
        await service.publish_now(post.id, user_id)

    assert post.status == "failed"
    assert account.platform_data == {"x_post_max_length": 200}


@pytest.mark.asyncio
async def test_post_service_uses_effective_limit(monkeypatch):
    from app.services import post_service as post_service_module

    user_id = uuid.uuid4()
    account = SocialAccount(
        id=uuid.uuid4(),
        user_id=user_id,
        platform="x",
        platform_user_id="user-42",
        display_name="xuser",
        access_token=token_encryptor.encrypt("tok"),
        status="active",
        platform_data={"x_post_max_length": 200},
    )
    post = Post(
        id=uuid.uuid4(),
        user_id=user_id,
        platform="x",
        hook="H",
        caption="C",
        cta="CTA",
        hashtags=[],
        status="approved",
    )

    captured = {}

    class RecordingPublisher:
        async def publish(self, post):
            return PublishResult("tweet-1")

    monkeypatch.setattr(
        post_service_module, "XPublisher", RecordingPublisher
    )
    monkeypatch.setattr(
        post_service_module,
        "obtain_valid_x_token",
        _fake_valid_token,
    )

    service = post_service_module.PostService(
        db=StubDB(account=account, post=post)
    )

    def recording_init(self, **kwargs):
        captured.update(kwargs)

    monkeypatch.setattr(
        RecordingPublisher, "__init__", recording_init
    )

    await service.publish_now(post.id, user_id)

    assert captured["max_post_length"] == 200


def test_generation_prompt_includes_length_constraint():
    from app.llm.prompts import build_generation_prompt
    from app.schemas.content import ContentGenerationRequest

    request = ContentGenerationRequest(
        platform="x",
        topic="AI agents",
    )

    prompt_with_limit = build_generation_prompt(request, post_max_length=200)
    assert "Length constraint" in prompt_with_limit
    assert "200 characters" in prompt_with_limit

    prompt_without = build_generation_prompt(request)
    assert "Length constraint" not in prompt_without