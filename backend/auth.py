"""Authentication middleware using API Keys."""

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from sqlmodel import SQLModel, Field

from config import settings

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
