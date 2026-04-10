"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


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
