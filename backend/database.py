"""Database engine and session management."""

import os
import asyncio

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

from config import settings, get_database_url

# Windows event loop policy (required for asyncio on Windows)
if os.name == "nt":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

DATABASE_URL = get_database_url(settings.database_url)

engine = create_async_engine(DATABASE_URL, echo=settings.db_echo)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def create_db_and_tables() -> None:
    """Create all database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session():
    """FastAPI dependency that yields an async database session."""
    async with async_session() as session:
        yield session
