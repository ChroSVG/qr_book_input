"""SQLModel database table definitions."""

from datetime import datetime, UTC
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, Text


class User(SQLModel, table=True):
    """Represents a registered user."""

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=50)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(sa_column=Column(Text))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Relationship
    download_logs: list["DownloadLog"] = Relationship(back_populates="user")


class DownloadLog(SQLModel, table=True):
    """Tracks file downloads by users."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    file_type: str = Field(max_length=20)  # csv, excel, pdf
    filename: Optional[str] = Field(default=None, max_length=255)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    downloaded_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Relationship
    user: Optional["User"] = Relationship(back_populates="download_logs")


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


