"""Authentication middleware - API Key and JWT User Authentication."""

import os
import secrets
from datetime import datetime, timedelta, UTC
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from sqlmodel import SQLModel, Field, select
from sqlmodel.ext.asyncio.session import AsyncSession

from config import settings
from models import User

# ── API Key Configuration ───────────────────────────────────────────

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# Get API key from settings
API_KEY = settings.api_key
if not API_KEY:
    # Generate one if not set (for development only!)
    API_KEY = secrets.token_urlsafe(32)
    print(f"⚠️  Generated API_KEY (save this in .env): {API_KEY}")


# ── API Key Storage (SQLite table) ─────────────────────────────────

class APIKeyRecord(SQLModel, table=True):
    """Store valid API keys."""

    __tablename__ = "api_keys"

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)
    name: str = Field(default="default")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = Field(default=None)


# ── JWT Authentication ─────────────────────────────────────────────

# JWT Configuration
SECRET_KEY = settings.jwt_secret or secrets.token_urlsafe(64)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing using bcrypt directly (avoid passlib incompatibility)
import bcrypt as bcrypt_lib

# OAuth2 scheme for JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return bcrypt_lib.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    # bcrypt has a 72-byte limit for passwords
    password_bytes = password.encode('utf-8')[:72]
    return bcrypt_lib.hashpw(password_bytes, bcrypt_lib.gensalt()).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify JWT token and return payload."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ [JWT] Token verified successfully, user_id={payload.get('sub')}")
        return payload
    except jwt.ExpiredSignatureError:
        print(f"❌ [JWT] Token EXPIRED")
        raise credentials_exception
    except jwt.InvalidTokenError as e:
        print(f"❌ [JWT] Invalid token: {e}")
        print(f"❌ [JWT] Token (first 20 chars): {token[:20]}...")
        print(f"❌ [JWT] SECRET_KEY (first 20 chars): {SECRET_KEY[:20]}...")
        raise credentials_exception
    except Exception as e:
        print(f"❌ [JWT] Unexpected error: {type(e).__name__}: {e}")
        raise credentials_exception


# ── Authentication Functions ────────────────────────────────────────

async def verify_api_key(api_key: str = Depends(api_key_header)) -> str:
    """
    Verify API key from request header.

    Usage in routes:
        @router.get("/protected")
        async def protected_route(api_key: str = Depends(verify_api_key)):
            # API key is valid, proceed
            return {"message": "Success"}
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is missing",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )

    return api_key


async def verify_api_key_optional(api_key: str = Depends(api_key_header)) -> Optional[str]:
    """
    Verify API key but don't fail if missing (for optional auth).

    Returns API key if valid, None if missing/invalid.
    """
    if not api_key:
        return None

    if api_key != API_KEY:
        return None

    return api_key
