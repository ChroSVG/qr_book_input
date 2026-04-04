"""SQLModel database table definitions."""

from datetime import datetime, UTC
from typing import Optional
from sqlmodel import SQLModel, Field


class Data(SQLModel, table=True):
    """Represents a single inventory item (barang)."""

    id: Optional[int] = Field(default=None, primary_key=True)
    qr_code: str = Field(index=True)
    name: str
    description: Optional[str] = None
    extra_info: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


