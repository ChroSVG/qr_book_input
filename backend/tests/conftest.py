"""Test fixtures — in-memory SQLite, test client, DB session overrides."""

import os
import sys

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Ensure backend package is importable
sys.path.insert(0, os.path.dirname(__file__))

from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine

from main import create_app  # noqa: E402
from database import get_session  # noqa: E402
import auth  # noqa: E402

# ── Test database setup ────────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# ── Test API Key ────────────────────────────────────────────────────────

TEST_API_KEY = "test-api-key-12345"


@pytest.fixture(autouse=True)
def override_api_key():
    """Override API_KEY in auth module for testing."""
    original_key = auth.API_KEY
    auth.API_KEY = TEST_API_KEY
    yield TEST_API_KEY
    auth.API_KEY = original_key


@pytest_asyncio.fixture
async def test_engine():
    """Create a fresh async engine with in-memory SQLite."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def session(test_engine):
    """Yield a SQLModel AsyncSession backed by in-memory SQLite."""
    async with AsyncSession(test_engine) as sess:
        yield sess


@pytest_asyncio.fixture
async def client(session):
    """Yield an async HTTP test client with the test DB session injected."""

    async def override_get_session():
        yield session

    app = create_app()
    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
