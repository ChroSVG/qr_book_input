"""Repository layer — abstracts all database access behind a clean interface.

The service layer depends on this, never on raw session/query logic.
"""

from datetime import UTC, datetime
from typing import Optional, Tuple, List

from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from models import Data


class DataRepository:
    """Data access for the inventory (barang) table."""

    def __init__(self, session: AsyncSession):
        self.session = session

    # ── Commands ───────────────────────────────────────────────────────

    async def add(self, item: Data) -> Data:
        """Persist a new item and refresh it from the DB."""
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def update(self, item: Data) -> Data:
        """Mark an item as dirty and commit changes."""
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def delete(self, item: Data) -> None:
        """Remove an item from the database."""
        await self.session.delete(item)
        await self.session.commit()

    # ── Queries ────────────────────────────────────────────────────────

    async def get_by_id(self, item_id: int) -> Optional[Data]:
        """Fetch a single item by primary key."""
        return await self.session.get(Data, item_id)

    async def get_by_item_code(self, item_code: str) -> Optional[Data]:
        """Fetch a single item by its item code."""
        stmt = select(Data).where(Data.item_code == item_code)
        result = await self.session.exec(stmt)
        return result.first()

    async def list_items(
        self,
        *,
        page: int = 1,
        limit: int = 10,
        search: Optional[str] = None,
    ) -> Tuple[List[Data], int]:
        """List items with optional search and pagination."""
        base_filter = None

        if search:
            like = f"%{search}%"
            base_filter = (Data.item_code.like(like)) | (Data.title.like(like))

        # Total count
        count_stmt = select(func.count()).select_from(Data)
        if base_filter is not None:
            count_stmt = count_stmt.where(base_filter)
        total = (await self.session.exec(count_stmt)).one()

        # Paginated results
        query = select(Data)
        if base_filter is not None:
            query = query.where(base_filter)
        query = query.offset((page - 1) * limit).limit(limit)

        items = (await self.session.exec(query)).all()
        return items, total

    async def fetch_all(self) -> List[Data]:
        """Return every item ordered by id (used for export)."""
        stmt = select(Data).order_by(Data.id)
        result = await self.session.exec(stmt)
        return result.all()
