"""Tests for API key authentication.

Covers:
  - Missing API key on protected endpoints (401)
  - Invalid API key (403)
  - Valid API key (200/201/204)
  - Public endpoints accessible without key
  - Protected endpoints require authentication
"""

import pytest
from httpx import AsyncClient

# ── Constants ────────────────────────────────────────────────────────────

SAMPLE_ITEM = {
    "item_code": "QR-AUTH-TEST",
    "title": "Auth Test Item",
    "description": "Testing authentication",
}

VALID_API_KEY = "test-api-key-12345"
INVALID_API_KEY = "wrong-api-key-xxxxx"


# ── Fixtures ─────────────────────────────────────────────────────────────

@pytest.fixture
def valid_api_key():
    """Return the valid API key for tests."""
    return VALID_API_KEY


@pytest.fixture
def auth_headers(valid_api_key):
    """Return headers with valid API key."""
    return {"X-API-Key": valid_api_key}


@pytest.fixture
def invalid_headers():
    """Return headers with invalid API key."""
    return {"X-API-Key": INVALID_API_KEY}


# ── Helper Functions ─────────────────────────────────────────────────────

async def create_item_with_key(client: AsyncClient, item_data, api_key: str):
    """Create item with API key in headers."""
    return await client.post(
        "/api/data/",
        json=item_data,
        headers={"X-API-Key": api_key},
    )


# ══════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS (No Authentication Required)
# ══════════════════════════════════════════════════════════════════════════

class TestPublicEndpoints:
    """Endpoints that should be accessible WITHOUT API key."""

    @pytest.mark.asyncio
    async def test_list_items_without_auth(self, client: AsyncClient):
        """GET /api/data/ — public, no auth required."""
        await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)

        resp = await client.get("/api/data/")
        assert resp.status_code == 200
        body = resp.json()
        assert "data" in body
        assert "total" in body

    @pytest.mark.asyncio
    async def test_get_item_by_id_without_auth(self, client: AsyncClient):
        """GET /api/data/{id} — public, no auth required."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        resp = await client.get(f"/api/data/{item_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == item_id

    @pytest.mark.asyncio
    async def test_get_item_by_item_code_without_auth(self, client: AsyncClient):
        """GET /api/data/qr/{item_code} — public, no auth required."""
        await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)

        resp = await client.get(f"/api/data/qr/{SAMPLE_ITEM['item_code']}")
        assert resp.status_code == 200
        assert resp.json()["item_code"] == SAMPLE_ITEM["item_code"]

    @pytest.mark.asyncio
    async def test_get_nonexistent_item_without_auth(self, client: AsyncClient):
        """GET /api/data/99999 — returns 404, not auth error."""
        resp = await client.get("/api/data/99999")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()


# ══════════════════════════════════════════════════════════════════════════
# PROTECTED ENDPOINTS (Authentication Required)
# ══════════════════════════════════════════════════════════════════════════

class TestProtectedEndpoints:
    """Endpoints that REQUIRE API key authentication."""

    # ── Missing API Key (401) ─────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_create_missing_api_key(self, client: AsyncClient):
        """POST /api/data/ — 401 without API key."""
        resp = await client.post("/api/data/", json=SAMPLE_ITEM)
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_update_missing_api_key(self, client: AsyncClient):
        """PUT /api/data/{id} — 401 without API key."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        resp = await client.put(f"/api/data/{item_id}", json={"title": "New"})
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_delete_missing_api_key(self, client: AsyncClient):
        """DELETE /api/data/{id} — 401 without API key."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        resp = await client.delete(f"/api/data/{item_id}")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_export_csv_missing_api_key(self, client: AsyncClient):
        """GET /api/data/export/csv — 401 without API key."""
        resp = await client.get("/api/data/export/csv")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_export_excel_missing_api_key(self, client: AsyncClient):
        """GET /api/data/export/excel — 401 without API key."""
        resp = await client.get("/api/data/export/excel")
        assert resp.status_code == 401

    # ── Invalid API Key (403) ─────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_create_invalid_api_key(self, client: AsyncClient):
        """POST /api/data/ — 403 with wrong API key."""
        resp = await client.post(
            "/api/data/",
            json=SAMPLE_ITEM,
            headers={"X-API-Key": INVALID_API_KEY},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_update_invalid_api_key(self, client: AsyncClient):
        """PUT /api/data/{id} — 403 with wrong API key."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        resp = await client.put(
            f"/api/data/{item_id}",
            json={"title": "New"},
            headers={"X-API-Key": INVALID_API_KEY},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_invalid_api_key(self, client: AsyncClient):
        """DELETE /api/data/{id} — 403 with wrong API key."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/api/data/{item_id}",
            headers={"X-API-Key": INVALID_API_KEY},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_export_csv_invalid_api_key(self, client: AsyncClient):
        """GET /api/data/export/csv — 403 with wrong API key."""
        resp = await client.get(
            "/api/data/export/csv",
            headers={"X-API-Key": INVALID_API_KEY},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_export_excel_invalid_api_key(self, client: AsyncClient):
        """GET /api/data/export/excel — 403 with wrong API key."""
        resp = await client.get(
            "/api/data/export/excel",
            headers={"X-API-Key": INVALID_API_KEY},
        )
        assert resp.status_code == 403

    # ── Valid API Key (200/201/204) ───────────────────────────────────

    @pytest.mark.asyncio
    async def test_create_with_valid_key(self, client: AsyncClient, valid_api_key):
        """POST /api/data/ — 201 with valid key."""
        resp = await client.post(
            "/api/data/",
            json=SAMPLE_ITEM,
            headers={"X-API-Key": valid_api_key},
        )
        assert resp.status_code == 201
        assert resp.json()["item_code"] == SAMPLE_ITEM["item_code"]

    @pytest.mark.asyncio
    async def test_update_with_valid_key(self, client: AsyncClient, valid_api_key):
        """PUT /api/data/{id} — 200 with valid key."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        resp = await client.put(
            f"/api/data/{item_id}",
            json={"title": "Updated"},
            headers={"X-API-Key": valid_api_key},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated"

    @pytest.mark.asyncio
    async def test_delete_with_valid_key(self, client: AsyncClient, valid_api_key):
        """DELETE /api/data/{id} — 204 with valid key."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/api/data/{item_id}",
            headers={"X-API-Key": valid_api_key},
        )
        assert resp.status_code == 204

    @pytest.mark.asyncio
    async def test_export_csv_with_valid_key(self, client: AsyncClient, valid_api_key):
        """GET /api/data/export/csv — 200 with valid key."""
        resp = await client.get(
            "/api/data/export/csv",
            headers={"X-API-Key": valid_api_key},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_export_excel_with_valid_key(self, client: AsyncClient, valid_api_key):
        """GET /api/data/export/excel — 200 with valid key."""
        resp = await client.get(
            "/api/data/export/excel",
            headers={"X-API-Key": valid_api_key},
        )
        assert resp.status_code == 200
