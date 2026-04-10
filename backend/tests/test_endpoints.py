"""Tests for all API endpoints.

Covers:
  POST   /api/data/
  GET    /api/data/          (with pagination & search)
  GET    /api/data/{id}
  GET    /api/data/qr/{item_code}
  PUT    /api/data/{id}
  DELETE /api/data/{id}
  GET    /api/data/export/csv
  GET    /api/data/export/excel
"""

import pytest
from httpx import AsyncClient

# ── Helpers ──────────────────────────────────────────────────────────────

SAMPLE = {
    "item_code": "ITEM-001",
    "title": "Laptop Dell XPS 15",
    "edition": "2024",
    "publisher_name": "Dell Inc.",
    "publish_year": 2024,
    "call_number": "QA76.73",
    "language_name": "English",
    "place_name": "Texas, USA",
    "classification": "004.678",
    "authors": "John Doe, Jane Smith",
    "topics": "Computing, Technology",
    "volume": "1",
    "description": "High-performance laptop",
    "extra_info": "Serial ABC123",
}

SAMPLE_MINIMAL = {
    "item_code": "ITEM-002",
    "title": "Book: Introduction to Algorithms",
}

# Test API key (matches conftest.py)
TEST_API_KEY = "test-api-key-12345"


def auth_headers():
    """Return headers with API key for protected endpoints."""
    return {"X-API-Key": TEST_API_KEY}


# ── POST /api/data/ ─────────────────────────────────────────────────────

class TestCreateItem:
    @pytest.mark.asyncio
    async def test_create_item_full(self, client: AsyncClient):
        """201 — item created with all biblio fields."""
        resp = await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        assert resp.status_code == 201
        body = resp.json()
        assert body["item_code"] == SAMPLE["item_code"]
        assert body["title"] == SAMPLE["title"]
        assert body["edition"] == SAMPLE["edition"]
        assert body["publisher_name"] == SAMPLE["publisher_name"]
        assert body["publish_year"] == SAMPLE["publish_year"]
        assert body["call_number"] == SAMPLE["call_number"]
        assert body["language_name"] == SAMPLE["language_name"]
        assert body["place_name"] == SAMPLE["place_name"]
        assert body["classification"] == SAMPLE["classification"]
        assert body["authors"] == SAMPLE["authors"]
        assert body["topics"] == SAMPLE["topics"]
        assert body["volume"] == SAMPLE["volume"]
        assert body["description"] == SAMPLE["description"]
        assert body["extra_info"] == SAMPLE["extra_info"]
        assert body["id"] is not None
        assert "created_at" in body
        assert "updated_at" in body

    @pytest.mark.asyncio
    async def test_create_item_minimal(self, client: AsyncClient):
        """201 — item created with only required fields."""
        resp = await client.post("/api/data/", json=SAMPLE_MINIMAL, headers=auth_headers())
        assert resp.status_code == 201
        body = resp.json()
        assert body["item_code"] == SAMPLE_MINIMAL["item_code"]
        assert body["title"] == SAMPLE_MINIMAL["title"]

    @pytest.mark.asyncio
    async def test_create_duplicate_item_code(self, client: AsyncClient):
        """409 — duplicate item_code rejected."""
        await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        resp = await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        assert resp.status_code == 409

    @pytest.mark.asyncio
    async def test_create_missing_title(self, client: AsyncClient):
        """422 — validation error when title is missing."""
        resp = await client.post("/api/data/", json={"item_code": "QR-X"}, headers=auth_headers())
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_item_code(self, client: AsyncClient):
        """422 — validation error when item_code is missing."""
        resp = await client.post("/api/data/", json={"title": "Test"}, headers=auth_headers())
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_create_publish_year_type(self, client: AsyncClient):
        """201 — publish_year is integer."""
        payload = {**SAMPLE_MINIMAL, "item_code": "ITEM-YEAR", "publish_year": 2023}
        resp = await client.post("/api/data/", json=payload, headers=auth_headers())
        assert resp.status_code == 201
        assert resp.json()["publish_year"] == 2023


# ── GET /api/data/qr/{item_code} ──────────────────────────────────────────

class TestGetByItemCode:
    @pytest.mark.asyncio
    async def test_get_existing(self, client: AsyncClient):
        """200 — item found by item_code."""
        await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        resp = await client.get(f"/api/data/qr/{SAMPLE['item_code']}")
        assert resp.status_code == 200
        assert resp.json()["item_code"] == SAMPLE["item_code"]
        assert resp.json()["title"] == SAMPLE["title"]

    @pytest.mark.asyncio
    async def test_get_not_found(self, client: AsyncClient):
        """404 — unknown item_code."""
        resp = await client.get("/api/data/qr/NONEXISTENT")
        assert resp.status_code == 404


# ── GET /api/data/{id} ──────────────────────────────────────────────────

class TestGetById:
    @pytest.mark.asyncio
    async def test_get_existing(self, client: AsyncClient):
        """200 — item found by ID."""
        create_resp = await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        item_id = create_resp.json()["id"]
        resp = await client.get(f"/api/data/{item_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == item_id
        assert resp.json()["title"] == SAMPLE["title"]

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

    @pytest.mark.asyncio
    async def test_list_with_items(self, client: AsyncClient):
        """200 — returns paginated items."""
        await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        await client.post("/api/data/", json=SAMPLE_MINIMAL, headers=auth_headers())
        resp = await client.get("/api/data/?page=1&limit=10")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["data"]) == 2
        assert body["total"] == 2
        assert body["page"] == 1
        assert body["limit"] == 10

    @pytest.mark.asyncio
    async def test_search_by_title(self, client: AsyncClient):
        """200 — search matches title (case-insensitive)."""
        await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        resp = await client.get("/api/data/?q=laptop")
        body = resp.json()
        assert body["total"] == 1
        assert "Laptop" in body["data"][0]["title"]

    @pytest.mark.asyncio
    async def test_search_by_item_code(self, client: AsyncClient):
        """200 — search matches item_code (case-insensitive)."""
        await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        resp = await client.get("/api/data/?q=ITEM-001")
        body = resp.json()
        assert body["total"] == 1

    @pytest.mark.asyncio
    async def test_search_no_match(self, client: AsyncClient):
        """200 — search returns empty when no match."""
        await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        resp = await client.get("/api/data/?q=NONEXISTENT")
        body = resp.json()
        assert body["total"] == 0
        assert body["data"] == []

    @pytest.mark.asyncio
    async def test_pagination_page_2(self, client: AsyncClient):
        """200 — page 2 returns correct items."""
        for i in range(15):
            payload = {**SAMPLE_MINIMAL, "item_code": f"PAGE-ITEM-{i:03d}", "title": f"Item {i}"}
            await client.post("/api/data/", json=payload, headers=auth_headers())
        resp = await client.get("/api/data/?page=2&limit=10")
        body = resp.json()
        assert len(body["data"]) == 5  # 15 total, page 2 = remaining 5
        assert body["page"] == 2
        assert body["total_pages"] == 2


# ── PUT /api/data/{id} ──────────────────────────────────────────────────

class TestUpdateItem:
    @pytest.mark.asyncio
    async def test_update_title(self, client: AsyncClient):
        """200 — partial update works."""
        create_resp = await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        item_id = create_resp.json()["id"]
        resp = await client.put(
            f"/api/data/{item_id}",
            json={"title": "Updated Title"},
            headers=auth_headers(),
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"
        # Other fields unchanged
        assert resp.json()["item_code"] == SAMPLE["item_code"]

    @pytest.mark.asyncio
    async def test_update_publish_year(self, client: AsyncClient):
        """200 — update integer field."""
        create_resp = await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        item_id = create_resp.json()["id"]
        resp = await client.put(
            f"/api/data/{item_id}",
            json={"publish_year": 2025},
            headers=auth_headers(),
        )
        assert resp.status_code == 200
        assert resp.json()["publish_year"] == 2025

    @pytest.mark.asyncio
    async def test_update_not_found(self, client: AsyncClient):
        """404 — update non-existent item."""
        resp = await client.put(
            "/api/data/99999",
            json={"title": "Test"},
            headers=auth_headers(),
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_multiple_fields(self, client: AsyncClient):
        """200 — update multiple fields at once."""
        create_resp = await client.post("/api/data/", json=SAMPLE_MINIMAL, headers=auth_headers())
        item_id = create_resp.json()["id"]
        resp = await client.put(
            f"/api/data/{item_id}",
            json={
                "title": "New Title",
                "authors": "New Author",
                "edition": "3rd",
                "language_name": "Arabic",
            },
            headers=auth_headers(),
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "New Title"
        assert resp.json()["authors"] == "New Author"
        assert resp.json()["edition"] == "3rd"
        assert resp.json()["language_name"] == "Arabic"


# ── DELETE /api/data/{id} ───────────────────────────────────────────────

class TestDeleteItem:
    @pytest.mark.asyncio
    async def test_delete_item(self, client: AsyncClient):
        """204 — item deleted successfully."""
        create_resp = await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        item_id = create_resp.json()["id"]
        resp = await client.delete(f"/api/data/{item_id}", headers=auth_headers())
        assert resp.status_code == 204
        # Verify gone
        resp = await client.get(f"/api/data/{item_id}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_not_found(self, client: AsyncClient):
        """404 — delete non-existent item."""
        resp = await client.delete("/api/data/99999", headers=auth_headers())
        assert resp.status_code == 404


# ── GET /api/data/export/csv ────────────────────────────────────────────

class TestExportCSV:
    @pytest.mark.asyncio
    async def test_export_csv_with_data(self, client: AsyncClient):
        """200 — CSV file with all biblio headers."""
        await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        resp = await client.get("/api/data/export/csv", headers=auth_headers())
        assert resp.status_code == 200
        assert "text/csv" in resp.headers["content-type"]
        assert "data_export.csv" in resp.headers["content-disposition"]
        text = resp.content.decode("utf-8-sig")  # strip BOM
        lines = text.strip().split("\r\n")
        # Check headers include all biblio fields
        header_line = lines[0]
        assert "item_code" in header_line
        assert "title" in header_line
        assert "edition" in header_line
        assert "publisher_name" in header_line
        assert "publish_year" in header_line
        assert "call_number" in header_line
        assert "language_name" in header_line
        assert "place_name" in header_line
        assert "classification" in header_line
        assert "authors" in header_line
        assert "topics" in header_line
        assert "volume" in header_line
        assert "description" in header_line
        assert "extra_info" in header_line

    @pytest.mark.asyncio
    async def test_export_csv_empty(self, client: AsyncClient):
        """200 — CSV with only headers, no data."""
        resp = await client.get("/api/data/export/csv", headers=auth_headers())
        assert resp.status_code == 200
        text = resp.content.decode("utf-8-sig")
        lines = text.strip().split("\r\n")
        assert len(lines) == 1  # header only


# ── GET /api/data/export/excel ──────────────────────────────────────────

class TestExportExcel:
    @pytest.mark.asyncio
    async def test_export_excel(self, client: AsyncClient):
        """200 — Excel file generated."""
        await client.post("/api/data/", json=SAMPLE, headers=auth_headers())
        resp = await client.get("/api/data/export/excel", headers=auth_headers())
        assert resp.status_code == 200
        assert "spreadsheetml.sheet" in resp.headers["content-type"]
        assert "data_export.xlsx" in resp.headers["content-disposition"]
        assert len(resp.content) > 0  # non-empty file

    @pytest.mark.asyncio
    async def test_export_excel_empty(self, client: AsyncClient):
        """200 — Excel file with only headers."""
        resp = await client.get("/api/data/export/excel", headers=auth_headers())
        assert resp.status_code == 200
        assert len(resp.content) > 0
