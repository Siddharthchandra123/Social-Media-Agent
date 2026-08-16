import base64
import hashlib
import secrets


def generate_pkce_pair() -> tuple[str, str]:
    """
    Generate an OAuth 2.0 PKCE (RFC 7636) pair.

    Returns (code_verifier, code_challenge) using the S256 method.
    The verifier is 86 URL-safe characters, within X's 43-128 limit.
    """
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode("ascii")).digest()
    ).rstrip(b"=").decode("ascii")
    return code_verifier, code_challenge


def generate_oauth_state() -> str:
    """Generate a CSRF-protection state value for OAuth redirects."""
    return secrets.token_urlsafe(32)


def validate_oauth_state(returned: str | None, saved: str | None) -> bool:
    """Constant-time comparison of the returned OAuth state against the saved one."""
    if not returned or not saved:
        return False
    return secrets.compare_digest(returned, saved)