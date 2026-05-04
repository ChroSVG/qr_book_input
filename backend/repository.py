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
        language_name: Optional[str] = None,
        classification: Optional[str] = None,
        publish_year: Optional[int] = None,
    ) -> Tuple[List[Data], int]:
        """List items with optional search and pagination."""
        filters = []

        # Full-text search across all columns
        if search:
            like = f"%{search}%"
            search_filter = (
                (Data.item_code.like(like)) |
                (Data.title.like(like)) |
                (Data.edition.like(like)) |
                (Data.publisher_name.like(like)) |
                (Data.call_number.like(like)) |
                (Data.language_name.like(like)) |
                (Data.place_name.like(like)) |
                (Data.classification.like(like)) |
                (Data.authors.like(like)) |
                (Data.topics.like(like)) |
                (Data.volume.like(like)) |
                (Data.description.like(like)) |
                (Data.extra_info.like(like))
            )
            filters.append(search_filter)

        # Column-specific filters
        if language_name:
            filters.append(Data.language_name.ilike(f"%{language_name}%"))
        if classification:
            filters.append(Data.classification.ilike(f"%{classification}%"))
        if publish_year:
            filters.append(Data.publish_year == publish_year)

        # Total count
        count_stmt = select(func.count()).select_from(Data)
        if filters:
            count_stmt = count_stmt.where(*filters)
        total = (await self.session.exec(count_stmt)).one()

        # Paginated results
        query = select(Data)
        if filters:
            query = query.where(*filters)
        query = query.offset((page - 1) * limit).limit(limit)

        items = (await self.session.exec(query)).all()
        return items, total

    async def fetch_all(self) -> List[Data]:
        """Return every item ordered by id (used for export)."""
        stmt = select(Data).order_by(Data.id)
        result = await self.session.exec(stmt)
        return result.all()
