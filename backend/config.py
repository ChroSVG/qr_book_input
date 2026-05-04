"""Application settings using pydantic-settings."""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os
import re


class Settings(BaseSettings):
    """Centralized configuration from environment variables."""

    # Database
    database_url: str = Field(..., alias="DATABASE_URL")
    db_echo: bool = Field(default=False, alias="DB_ECHO")

    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")

    # CORS
    cors_origins: List[str] = Field(default_factory=lambda: ["*"], alias="CORS_ORIGINS")
    cors_allow_credentials: bool = Field(default=True, alias="CORS_ALLOW_CREDENTIALS")
    cors_allow_methods: List[str] = Field(default_factory=lambda: ["*"], alias="CORS_ALLOW_METHODS")
    cors_allow_headers: List[str] = Field(default_factory=lambda: ["*"], alias="CORS_ALLOW_HEADERS")

    # SSL (optional)
    ssl_keyfile: str | None = Field(default=None, alias="SSL_KEYFILE")
    ssl_certfile: str | None = Field(default=None, alias="SSL_CERTFILE")

    # Frontend dist path
    dist_dir: str = Field(default="dist", alias="DIST_DIR")
    
    # API Key Authentication
    api_key: str | None = Field(default=None, alias="API_KEY")

    # JWT Authentication
    jwt_secret: str | None = Field(default=None, alias="JWT_SECRET")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "populate_by_name": True}


def get_database_url(raw_url: str) -> str:
    """Convert postgresql:// URL to postgresql+psycopg:// for async driver."""
    return re.sub(r"^postgresql:", "postgresql+psycopg:", raw_url)


# Singleton settings instance
settings = Settings()
