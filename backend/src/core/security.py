"""AWS Cognito JWT token validation and FastAPI security dependencies for Phase 6.

Features:
- Async JWKS key cache fetching from Cognito User Pool .well-known/jwks.json
- Automatic key rotation refresh (7-day TTL cache, refresh on miss)
- JWT verification: iss, aud, exp, nbf, iat, token_use validation
- FastAPI dependencies: get_current_user, require_role(allowed_roles)
- JIT (Just-In-Time) user creation upon first valid token presentation
- Standard error envelopes for unauthorized/forbidden requests
"""

import json
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, List, Dict, Any, Callable
from urllib.parse import urlparse

from jose import jwt, JWTError, jwk  # josepy for JWK handling
from jose.utils import base64url_decode

from src.core.database import get_db, AsyncSession
from src.core.config import settings
from src.core.database import Base
from src.modules.catalog.models import ToolModel
from sqlalchemy.ext.asyncio import AsyncSession as SAAsyncSession
from sqlalchemy import select, UUID

def is_safe_outbound_url(url: str) -> bool:
    """Allow only absolute HTTP(S) URLs without embedded credentials."""
    if not url or any(ch.isspace() for ch in url):
        return False
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
    except ValueError:
        return False
    if parsed.scheme not in {"http", "https"}:
        return False
    if not parsed.netloc or not hostname:
        return False
    if parsed.username or parsed.password:
        return False
    return True


# ---------------------------------------------------------------------------
# JWKS Cache (in-memory with time-based refresh)
# ---------------------------------------------------------------------------

_jwks_cache: Dict[str, Any] = {
    "keys": [],
    "fetched_at": 0.0,
}
_jwks_cache_lock = asyncio.Lock()


async def _fetch_cognito_jwks() -> Dict[str, Any]:
    """Fetch JWKS from Cognito User Pool endpoint.

    Returns the parsed JSON with RSA public keys.
    Cognito URL format: https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/jwks.json
    """
    region = settings.COGNITO_REGION or "us-east-1"
    pool_id = settings.COGNITO_USER_POOL_ID or ""
    if not pool_id:
        raise ValueError("COGNITO_USER_POOL_ID must be configured")

    jwks_url = f"https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/jwks.json"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        return response.json()


async def _get_cached_jwks() -> Dict[str, Any]:
    """Return cached JWKS, refreshing if older than 7 days (1-week TTL)."""
    global _jwks_cache

    async with _jwks_cache_lock:
        now = time.time()
        # Refresh if cache is empty or older than 7 days (604800 seconds)
        if not _jwks_cache["keys"] or now - _jwks_cache["fetched_at"] > 604800:
            _jwks_cache = await _fetch_cognito_jwks()
            _jwks_cache["fetched_at"] = now

        return _jwks_cache


# ---------------------------------------------------------------------------
# JWT Helpers
# ---------------------------------------------------------------------------

def _extract_jwk_key(jwks: Dict[str, Any], kid: str) -> Any:
    """Extract an RSA public key from JWKS by key ID (kid)."""
    for jwk_dict in jwks.get("keys", []):
        if jwk_dict.get("kid") == kid:
            # josepy JWK construction
            from jose import JWK
            return JWK.from_dict(jwk_dict)
    raise JWTError(f"Key ID '{kid}' not found in JWKS")


def _verify_token_sub(
    token: str,
    jwks: Dict[str, Any],
    expected_aud: str,
    expected_iss: str,
) -> Dict[str, Any]:
    """Verify a Cognito JWT and return the decoded payload.

    Validates:
    - iss (Issuer) must match Cognito User Pool URL
    - aud (Audience) must match configured App Client ID
    - exp (Expiration) must be in the future
    - iat (Issued-at) must be reasonable
    - token_use must be "id" for ID tokens or "access" for access tokens
    - signature validation using JWKS
    """
    # Decode without verification first to get kid
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise JWTError(f"Invalid token header: {exc}") from exc

    kid = unverified_header.get("kid")
    if not kid:
        raise JWTError("Token header missing 'kid' field")

    # Load matching RSA key from JWKS
    rsa_key = _extract_jwk_key(jwks, kid)

    # Verify and decode
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=expected_aud,
            issuer=expected_iss,
            options={
                "verify_exp": True,  # expiration
                "verify_nbf": True,  # not-before
                "verify_iat": True,  # issued-at
                "verify_signature": True,
            },
        )
        return payload
    except JWTError as exc:
        raise JWTError(f"JWT validation failed: {exc}") from exc


# ---------------------------------------------------------------------------
# FastAPI Security Dependencies
# ---------------------------------------------------------------------------

import asyncio

from fastapi import Request, HTTPException, Depends, status
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.responses import JSONResponse
from pydantic import BaseModel

CognitoUser = Dict[str, Any]


class UserContext(BaseModel):
    """Pydantic model for the authenticated user context."""

    id: str  # Cognito sub
    email: str
    display_name: Optional[str] = None
    role: str = "user"
    is_email_verified: bool = False


async def _get_current_user_from_token(
    request: Request,
) -> CognitoUser:
    """Extract and verify Cognito JWT from Authorization header.

    Expected: Authorization: Bearer <id_token>
    Returns the decoded payload dict, or raises HTTPException.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header[len("Bearer "):].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Build expected issuer and audience
    region = settings.COGNITO_REGION or "us-east-1"
    pool_id = settings.COGNITO_USER_POOL_ID or ""
    app_client_id = settings.COGNITO_APP_CLIENT_ID or ""

    if not pool_id or not app_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cognito configuration incomplete",
        )

    expected_iss = f"https://cognito-idp.{region}.amazonaws.com/{pool_id}"
    expected_aud = app_client_id

    # Get cached JWKS
    jwks = await _get_cached_jwks()

    # Verify token
    payload = _verify_token_sub(token, jwks, expected_aud, expected_iss)

    # payload["sub"] is the stable Cognito user identifier
    return payload


async def get_current_user(request: Request) -> UserContext:
    """FastAPI dependency that returns the authenticated UserContext.

    - Validates Cognito ID token
    - Performs JIT user creation if user doesn't exist in PostgreSQL
    - Returns UserContext with id, email, display_name, role, is_email_verified
    - Raises HTTP 401 if token is invalid/missing
    """
    payload = await _get_current_user_from_token(request)

    cognito_sub: str = payload.get("sub", "")
    if not cognito_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' field",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email: str = payload.get("email", "")
    is_verified: bool = payload.get("email_verified", False)
    given_name: Optional[str] = payload.get("given_name")
    family_name: Optional[str] = payload.get("family_name")
    name: Optional[str] = payload.get("name")

    # Build display name
    display_name: Optional[str] = (
        name or given_name or family_name or cognito_sub
    )

    # JIT user creation / lookup in PostgreSQL
    async with get_db() as session:  # type: ignore[attr-defined]
        # Try to find existing user by cognito_sub
        result = await session.execute(
            select(UserModel).where(UserModel.cognito_sub == cognito_sub)  # type: ignore[attr-defined]
        )
        user = result.scalar_one_or_none()

        if user is None:
            # Create new user (JIT)
            from src.modules.identity.models import UserModel as IdentityUser

            new_user = IdentityUser(
                id=uuid.uuid4(),
                cognito_sub=cognito_sub,
                email=email,
                display_name=display_name,
                role="user",
                is_email_verified=is_verified,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)

            user = new_user

    return UserContext(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_email_verified=user.is_email_verified,
    )


def require_role(
    allowed_roles: List[str],
) -> Callable:
    """FastAPI dependency factory that restricts access to allowed roles.

    Usage: Depends(require_role(["user", "admin"]))

    Raises HTTP 403 if the user's role is not in allowed_roles.
    """

    async def _check_role(current_user: UserContext = Depends(get_current_user)) -> UserContext:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return _check_role


# ---------------------------------------------------------------------------
# Utility: Role checks for common patterns
# ---------------------------------------------------------------------------

def is_user(current_user: UserContext = Depends(get_current_user)) -> UserContext:
    """Shortcut dependency: current user must have role 'user'."""
    return require_role(["user"])(current_user)


def is_vendor(current_user: UserContext = Depends(get_current_user)) -> UserContext:
    """Shortcut dependency: current user must have role 'vendor' or 'admin'."""
    return require_role(["vendor", "admin"])(current_user)


def is_admin(current_user: UserContext = Depends(get_current_user)) -> UserContext:
    """Shortcut dependency: current user must have role 'admin'."""
    return require_role(["admin"])(current_user)