"""SQLModel database table definitions."""

from datetime import datetime, UTC
from typing import Optional
from sqlmodel import SQLModel, Field


class Data(SQLModel, table=True):
    """Represents a single inventory / biblio item."""

    id: Optional[int] = Field(default=None, primary_key=True)
    item_code: str = Field(index=True)
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


