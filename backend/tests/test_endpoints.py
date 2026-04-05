"""Tests for all API endpoints.

Covers:
  POST   /api/data/
  GET    /api/data/          (with pagination & search)
  GET    /api/data/{id}
  GET    /api/data/qr/{qr}
  PUT    /api/data/{id}
  DELETE /api/data/{id}
  GET    /api/data/export/csv
  GET    /api/data/export/excel
"""

import pytest
from httpx import AsyncClient

# ── Helpers ──────────────────────────────────────────────────────────────

SAMPLE = {
    "qr_code": "QR-001",
    "name": "Laptop",
    "description": "MacBook Pro",
    "extra_info": "Serial ABC123",
}


# ── POST /api/data/ ─────────────────────────────────────────────────────

class TestCreateItem:
    @pytest.mark.asyncio
    async def test_create_item(self, client: AsyncClient):
        """201 — item created successfully."""
        resp = await client.post("/api/data/", json=SAMPLE)
        assert resp.status_code == 201
        body = resp.json()
        assert body["qr_code"] == SAMPLE["qr_code"]
        assert body["name"] == SAMPLE["name"]
        assert body["id"] is not None

    @pytest.mark.asyncio
    async def test_create_duplicate_qr(self, client: AsyncClient):
        """409 — duplicate QR code rejected."""
        await client.post("/api/data/", json=SAMPLE)
        resp = await client.post("/api/data/", json=SAMPLE)
        assert resp.status_code == 409

    @pytest.mark.asyncio
    async def test_create_missing_name(self, client: AsyncClient):
        """422 — validation error when name is missing."""
        resp = await client.post("/api/data/", json={"qr_code": "QR-X"})
        assert resp.status_code == 422


# ── GET /api/data/qr/{qr_code} ──────────────────────────────────────────

class TestGetByQR:
    @pytest.mark.asyncio
    async def test_get_existing(self, client: AsyncClient):
        """200 — item found by QR code."""
        await client.post("/api/data/", json=SAMPLE)
        resp = await client.get(f"/api/data/qr/{SAMPLE['qr_code']}")
        assert resp.status_code == 200
        assert resp.json()["qr_code"] == SAMPLE["qr_code"]

    @pytest.mark.asyncio
    async def test_get_not_found(self, client: AsyncClient):
        """404 — unknown QR code."""
        resp = await client.get("/api/data/qr/NONEXISTENT")
        assert resp.status_code == 404


# ── GET /api/data/{id} ──────────────────────────────────────────────────

class TestGetById:
    @pytest.mark.asyncio
    async def test_get_existing(self, client: AsyncClient):
        """200 — item found by ID."""
        create_resp = await client.post("/api/data/", json=SAMPLE)
        item_id = create_resp.json()["id"]
        resp = await client.get(f"/api/data/{item_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == item_id

    @pytest.mark.asyncio
    async def test_get_not_found(self, client: AsyncClient):
        """404 — non-existent ID."""
        resp = await client.get("/api/data/99999")
        assert resp.status_code == 404


# ── GET /api/data/  (list, paginated, with search) ──────────────────────

class TestListItems:
    @pytest.mark.asyncio
    async def test_list_empty(self, client: AsyncClient):
        """200 — empty list returns zero items."""
        resp = await client.get("/api/data/")
        assert resp.status_code == 200
        body = resp.json()
        assert body["data"] == []
        assert body["total"] == 0
        assert body["page"] == 1

    @pytest.mark.asyncio
    async def test_list_defaults(self, client: AsyncClient):
        """200 — default pagination (page=1, limit=10)."""
        await client.post("/api/data/", json=SAMPLE)
        resp = await client.get("/api/data/")
        body = resp.json()
        assert body["page"] == 1
        assert body["limit"] == 10
        assert len(body["data"]) == 1
        assert body["total"] == 1

    @pytest.mark.asyncio
    async def test_list_pagination(self, client: AsyncClient):
        """200 — pagination works with custom page/limit."""
        for i in range(5):
            await client.post("/api/data/", json={
                "qr_code": f"QR-PAG-{i}",
                "name": f"Item {i}",
            })
        resp = await client.get("/api/data/?page=1&limit=2")
        body = resp.json()
        assert len(body["data"]) == 2
        assert body["total"] >= 5
        assert body["total_pages"] >= 3

    @pytest.mark.asyncio
    async def test_list_search_by_qr(self, client: AsyncClient):
        """200 — search filters by qr_code (case-insensitive)."""
        await client.post("/api/data/", json={"qr_code": "SEARCH-QR", "name": "Alpha"})
        await client.post("/api/data/", json={"qr_code": "OTHER-QR", "name": "Beta"})
        resp = await client.get("/api/data/?q=search")
        body = resp.json()
        assert len(body["data"]) == 1
        assert body["data"][0]["name"] == "Alpha"

    @pytest.mark.asyncio
    async def test_list_search_by_name(self, client: AsyncClient):
        """200 — search filters by name (case-insensitive)."""
        await client.post("/api/data/", json={"qr_code": "QR-10", "name": "UniqueWidget"})
        await client.post("/api/data/", json={"qr_code": "QR-11", "name": "GenericThing"})
        resp = await client.get("/api/data/?q=widget")
        body = resp.json()
        assert len(body["data"]) == 1
        assert body["data"][0]["name"] == "UniqueWidget"


# ── PUT /api/data/{id} ──────────────────────────────────────────────────

class TestUpdateItem:
    @pytest.mark.asyncio
    async def test_update_name(self, client: AsyncClient):
        """200 — partial update changes only name."""
        create_resp = await client.post("/api/data/", json=SAMPLE)
        item_id = create_resp.json()["id"]

        resp = await client.put(f"/api/data/{item_id}", json={"name": "Updated Laptop"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "Updated Laptop"
        # Other fields unchanged
        assert body["qr_code"] == SAMPLE["qr_code"]
        assert body["description"] == SAMPLE["description"]

    @pytest.mark.asyncio
    async def test_update_not_found(self, client: AsyncClient):
        """404 — update on non-existent ID."""
        resp = await client.put("/api/data/99999", json={"name": "Ghost"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_empty_payload(self, client: AsyncClient):
        """200 — empty payload does nothing harmful."""
        create_resp = await client.post("/api/data/", json=SAMPLE)
        item_id = create_resp.json()["id"]
        resp = await client.put(f"/api/data/{item_id}", json={})
        assert resp.status_code == 200


# ── DELETE /api/data/{id} ───────────────────────────────────────────────

class TestDeleteItem:
    @pytest.mark.asyncio
    async def test_delete_existing(self, client: AsyncClient):
        """204 — item deleted successfully."""
        create_resp = await client.post("/api/data/", json=SAMPLE)
        item_id = create_resp.json()["id"]
        resp = await client.delete(f"/api/data/{item_id}")
        assert resp.status_code == 204

        # Confirm it's gone
        resp = await client.get(f"/api/data/{item_id}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_not_found(self, client: AsyncClient):
        """404 — delete on non-existent ID."""
        resp = await client.delete("/api/data/99999")
        assert resp.status_code == 404


# ── GET /api/data/export/csv ────────────────────────────────────────────

class TestExportCSV:
    @pytest.mark.asyncio
    async def test_export_csv_has_bom(self, client: AsyncClient):
        """200 — CSV response starts with UTF-8 BOM."""
        await client.post("/api/data/", json=SAMPLE)
        resp = await client.get("/api/data/export/csv")
        assert resp.status_code == 200
        assert resp.content.startswith(b"\xef\xbb\xbf")  # UTF-8 BOM

    @pytest.mark.asyncio
    async def test_export_csv_content(self, client: AsyncClient):
        """200 — CSV contains headers and data rows."""
        await client.post("/api/data/", json=SAMPLE)
        resp = await client.get("/api/data/export/csv")
        text = resp.content.decode("utf-8-sig")  # strips BOM
        assert "qr_code" in text
        assert SAMPLE["qr_code"] in text
        assert SAMPLE["name"] in text

    @pytest.mark.asyncio
    async def test_export_csv_empty(self, client: AsyncClient):
        """200 — CSV with only headers when no data."""
        resp = await client.get("/api/data/export/csv")
        assert resp.status_code == 200
        text = resp.content.decode("utf-8-sig")
        assert "qr_code" in text


# ── GET /api/data/export/excel ──────────────────────────────────────────

class TestExportExcel:
    @pytest.mark.asyncio
    async def test_export_excel(self, client: AsyncClient):
        """200 — Excel file returned."""
        await client.post("/api/data/", json=SAMPLE)
        resp = await client.get("/api/data/export/excel")
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        # xlsx files start with PK (zip)
        assert resp.content.startswith(b"PK")
