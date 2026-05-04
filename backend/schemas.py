"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Auth schemas ─────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    """Payload for user registration."""
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class UserLogin(BaseModel):
    """Payload for user login."""
    username: str
    password: str


class UserResponse(BaseModel):
    """User profile response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Download tracking schemas ───────────────────────────────────────────

class DownloadLogResponse(BaseModel):
    """Download log entry response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    file_type: str
    filename: Optional[str] = None
    downloaded_at: datetime


class DownloadHistoryResponse(BaseModel):
    """Download history response."""
    downloads: list[DownloadLogResponse]
    total: int


# ── Shared fields ────────────────────────────────────────────────────────

class DataBase(BaseModel):
    """Fields shared by create/update operations."""
    item_code: str
    title: str
    edition: Optional[str] = None
    publisher_name: Optional[str] = None
    publish_year: Optional[int] = None
    call_number: Optional[str] = None
    language_name: Optional[str] = None
    place_name: Optional[str] = None
    classification: Optional[str] = None
    authors: Optional[str] = None
    topics: Optional[str] = None
    volume: Optional[str] = None
    description: Optional[str] = None
    extra_info: Optional[str] = None


# ── Request schemas ──────────────────────────────────────────────────────

class DataCreate(DataBase):
    """Payload for creating a new inventory item."""
    pass


class DataUpdate(BaseModel):
    """Payload for updating an existing item (all fields optional)."""
    item_code: Optional[str] = None
    title: Optional[str] = None
    edition: Optional[str] = None
    publisher_name: Optional[str] = None
    publish_year: Optional[int] = None
    call_number: Optional[str] = None
    language_name: Optional[str] = None
    place_name: Optional[str] = None
    classification: Optional[str] = None
    authors: Optional[str] = None
    topics: Optional[str] = None
    volume: Optional[str] = None
    description: Optional[str] = None
    extra_info: Optional[str] = None


# ── Response schemas ─────────────────────────────────────────────────────

class DataResponse(DataBase):
    """Single item response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class DataListResponse(BaseModel):
    """Paginated list response."""
    data: list[DataResponse]
    total: int
    page: int
    limit: int
    total_pages: int
