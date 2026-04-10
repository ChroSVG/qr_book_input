"""Service layer — the only layer that business logic and use-cases live.

Depends on the repository. Never imports from database or raw SQL.
"""

from datetime import UTC, datetime
from typing import List, Optional, Tuple

from models import Data
from schemas import DataCreate, DataUpdate
from repository import DataRepository


class DataService:
    """Use-case orchestrator for inventory operations."""

    def __init__(self, repo: DataRepository):
        self.repo = repo

    # ── Create ─────────────────────────────────────────────────────────

    async def create_item(self, payload: DataCreate) -> Data:
        """Create a new inventory item."""
        item = Data(**payload.model_dump())
        return await self.repo.add(item)

    async def get_by_qr(self, item_code: str) -> Optional[Data]:
        """Check if an item code already exists."""
        return await self.repo.get_by_item_code(item_code)

    # ── Read ───────────────────────────────────────────────────────────

    async def get_item(self, item_id: int) -> Optional[Data]:
        """Get a single item by ID."""
        return await self.repo.get_by_id(item_id)

    async def list_items(
        self,
        *,
        page: int = 1,
        limit: int = 10,
        search: Optional[str] = None,
    ) -> Tuple[List[Data], int]:
        """List items with optional search and pagination."""
        return await self.repo.list_items(page=page, limit=limit, search=search)

    # ── Update ─────────────────────────────────────────────────────────

    async def update_item(self, item_id: int, payload: DataUpdate) -> Optional[Data]:
        """Partially update an item. Returns None if not found."""
        item = await self.repo.get_by_id(item_id)
        if not item:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        item.updated_at = datetime.now(UTC)

        return await self.repo.update(item)

    # ── Delete ─────────────────────────────────────────────────────────

    async def delete_item(self, item_id: int) -> bool:
        """Delete an item. Returns False if not found."""
        item = await self.repo.get_by_id(item_id)
        if not item:
            return False
        await self.repo.delete(item)
        return True

    # ── Export ─────────────────────────────────────────────────────────

    async def fetch_all_items(self) -> List[Data]:
        """Fetch all items (used for export — no pagination)."""
        return await self.repo.fetch_all()
