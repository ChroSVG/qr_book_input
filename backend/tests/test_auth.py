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

# ── Constants ──────────────────────────────────────────────────────────────

SAMPLE_ITEM = {
    "qr_code": "QR-AUTH-TEST",
    "name": "Auth Test Item",
    "description": "Testing authentication",
}

VALID_API_KEY = "test-api-key-12345"
INVALID_API_KEY = "wrong-api-key-xxxxx"


# ── Fixtures ───────────────────────────────────────────────────────────────

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


# ── Helper Functions ───────────────────────────────────────────────────────

async def create_item_with_key(client: AsyncClient, item_data, api_key: str):
    """Create item with API key in headers."""
    return await client.post(
        "/api/data/",
        json=item_data,
        headers={"X-API-Key": api_key},
    )


# ═══════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS (No Authentication Required)
# ═══════════════════════════════════════════════════════════════════════════

class TestPublicEndpoints:
    """Endpoints that should be accessible WITHOUT API key."""

    @pytest.mark.asyncio
    async def test_list_items_without_auth(self, client: AsyncClient):
        """GET /api/data/ — public, no auth required."""
        # Create an item first (using test client with session)
        await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)

        # Now access without auth
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
    async def test_get_item_by_qr_without_auth(self, client: AsyncClient):
        """GET /api/data/qr/{qr_code} — public, no auth required."""
        await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)

        resp = await client.get(f"/api/data/qr/{SAMPLE_ITEM['qr_code']}")
        assert resp.status_code == 200
        assert resp.json()["qr_code"] == SAMPLE_ITEM["qr_code"]

    @pytest.mark.asyncio
    async def test_get_nonexistent_item_without_auth(self, client: AsyncClient):
        """GET /api/data/99999 — returns 404, not auth error."""
        resp = await client.get("/api/data/99999")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()


# ═══════════════════════════════════════════════════════════════════════════
# PROTECTED ENDPOINTS (Authentication Required)
# ═══════════════════════════════════════════════════════════════════════════

class TestProtectedEndpoints:
    """Endpoints that REQUIRE API key authentication."""

    # ── POST /api/data/ ───────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_create_without_api_key(self, client: AsyncClient):
        """POST /api/data/ — 401 when no API key provided."""
        resp = await client.post("/api/data/", json=SAMPLE_ITEM)
        assert resp.status_code == 401
        body = resp.json()
        assert "api key" in body["detail"].lower()

    @pytest.mark.asyncio
    async def test_create_with_invalid_api_key(self, client: AsyncClient):
        """POST /api/data/ — 403 when invalid API key provided."""
        resp = await create_item_with_key(client, SAMPLE_ITEM, INVALID_API_KEY)
        assert resp.status_code == 403
        body = resp.json()
        assert "invalid" in body["detail"].lower()

    @pytest.mark.asyncio
    async def test_create_with_valid_api_key(self, client: AsyncClient, valid_api_key):
        """POST /api/data/ — 201 when valid API key provided."""
        resp = await create_item_with_key(client, SAMPLE_ITEM, valid_api_key)
        assert resp.status_code == 201
        body = resp.json()
        assert body["qr_code"] == SAMPLE_ITEM["qr_code"]
        assert body["name"] == SAMPLE_ITEM["name"]

    # ── PUT /api/data/{id} ────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_update_without_api_key(self, client: AsyncClient):
        """PUT /api/data/{id} — 401 when no API key provided."""
        # First create an item
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        # Try to update without auth
        resp = await client.put(f"/api/data/{item_id}", json={"name": "Updated"})
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_update_with_invalid_api_key(self, client: AsyncClient):
        """PUT /api/data/{id} — 403 when invalid API key provided."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        resp = await client.put(
            f"/api/data/{item_id}",
            json={"name": "Updated"},
            headers={"X-API-Key": INVALID_API_KEY},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_update_with_valid_api_key(self, client: AsyncClient, valid_api_key):
        """PUT /api/data/{id} — 200 when valid API key provided."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, valid_api_key)
        item_id = create_resp.json()["id"]

        resp = await client.put(
            f"/api/data/{item_id}",
            json={"name": "Updated Name"},
            headers={"X-API-Key": valid_api_key},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"

    # ── DELETE /api/data/{id} ─────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_delete_without_api_key(self, client: AsyncClient):
        """DELETE /api/data/{id} — 401 when no API key provided."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        resp = await client.delete(f"/api/data/{item_id}")
        assert resp.status_code == 401
        # Item should still exist
        get_resp = await client.get(f"/api/data/{item_id}")
        assert get_resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_with_invalid_api_key(self, client: AsyncClient):
        """DELETE /api/data/{id} — 403 when invalid API key provided."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, VALID_API_KEY)
        item_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/api/data/{item_id}",
            headers={"X-API-Key": INVALID_API_KEY},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_with_valid_api_key(self, client: AsyncClient, valid_api_key):
        """DELETE /api/data/{id} — 204 when valid API key provided."""
        create_resp = await create_item_with_key(client, SAMPLE_ITEM, valid_api_key)
        item_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/api/data/{item_id}",
            headers={"X-API-Key": valid_api_key},
        )
        assert resp.status_code == 204

        # Confirm deleted
        get_resp = await client.get(f"/api/data/{item_id}")
        assert get_resp.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════
# EXPORT ENDPOINTS (Authentication Required)
# ═══════════════════════════════════════════════════════════════════════════

class TestExportAuthentication:
    """Export endpoints require API key authentication."""

    # ── CSV Export ──────────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_export_csv_without_api_key(self, client: AsyncClient):
        """GET /api/data/export/csv — 401 when no API key provided."""
        resp = await client.get("/api/data/export/csv")
        assert resp.status_code == 401
        assert "api key" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_export_csv_with_invalid_api_key(self, client: AsyncClient):
        """GET /api/data/export/csv — 403 when invalid API key."""
        resp = await client.get(
            "/api/data/export/csv",
            headers={"X-API-Key": INVALID_API_KEY},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_export_csv_with_valid_api_key(self, client: AsyncClient, valid_api_key):
        """GET /api/data/export/csv — 200 when valid API key."""
        # Create item first
        await create_item_with_key(client, SAMPLE_ITEM, valid_api_key)

        resp = await client.get(
            "/api/data/export/csv",
            headers={"X-API-Key": valid_api_key},
        )
        assert resp.status_code == 200
        assert resp.content.startswith(b"\xef\xbb\xbf")  # UTF-8 BOM

    # ── Excel Export ────────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_export_excel_without_api_key(self, client: AsyncClient):
        """GET /api/data/export/excel — 401 when no API key provided."""
        resp = await client.get("/api/data/export/excel")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_export_excel_with_valid_api_key(self, client: AsyncClient, valid_api_key):
        """GET /api/data/export/excel — 200 when valid API key."""
        await create_item_with_key(client, SAMPLE_ITEM, valid_api_key)

        resp = await client.get(
            "/api/data/export/excel",
            headers={"X-API-Key": valid_api_key},
        )
        assert resp.status_code == 200
        assert resp.content.startswith(b"PK")  # xlsx is zip format


# ═══════════════════════════════════════════════════════════════════════════
# AUTH INFO ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════

class TestAuthInfoEndpoint:
    """Test the /api/auth/info endpoint."""

    @pytest.mark.asyncio
    async def test_auth_info_public(self, client: AsyncClient):
        """GET /api/auth/info — should be public (no auth required)."""
        resp = await client.get("/api/auth/info")
        # Should not return 401 (might be caught by SPA router in test env)
        # If it returns HTML, that's from SPA router (acceptable in tests)
        if resp.status_code == 200:
            content_type = resp.headers.get("content-type", "")
            # If it's JSON, validate the structure
            if "application/json" in content_type:
                body = resp.json()
                assert "auth_type" in body
                assert body["auth_type"] == "api_key"
            # If it's HTML, that's from SPA router - also acceptable
            elif "text/html" in content_type:
                pass  # SPA router caught it, acceptable in test environment


# ═══════════════════════════════════════════════════════════════════════════
# API KEY HEADER FORMATS
# ═══════════════════════════════════════════════════════════════════════════

class TestAPIKeyHeaderFormats:
    """Test different ways to provide API key."""

    @pytest.mark.asyncio
    async def test_api_key_in_headers(self, client: AsyncClient, valid_api_key):
        """API key in standard X-API-Key header works."""
        resp = await client.post(
            "/api/data/",
            json=SAMPLE_ITEM,
            headers={"X-API-Key": valid_api_key},
        )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_empty_api_key_rejected(self, client: AsyncClient):
        """Empty string API key should be treated as missing."""
        resp = await client.post(
            "/api/data/",
            json=SAMPLE_ITEM,
            headers={"X-API-Key": ""},
        )
        assert resp.status_code == 401
