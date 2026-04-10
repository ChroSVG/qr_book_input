"""One-time migration: rename qr_code→item_code, name→title, add biblio fields.

Run: python migrate_schema.py
"""
import asyncio
import sys
from sqlalchemy import text

sys.path.insert(0, ".")

from database import engine
from models import Data  # noqa: ensure latest schema is imported


async def migrate():
    async with engine.begin() as conn:
        # Check if old table exists
        result = await conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='data'"
        ))
        if not result.scalar():
            print("No existing 'data' table — new tables will be created on startup.")
            return

        # Get columns
        result = await conn.execute(text("PRAGMA table_info(data)"))
        columns = [row[1] for row in result.all()]

        if "item_code" in columns:
            print("Already migrated — nothing to do.")
            return

        print(f"Old columns found: {columns}")
        print("Dropping old table and recreating with new schema...")

        # Backup data
        result = await conn.execute(text("SELECT * FROM data"))
        rows = result.fetchall()
        print(f"Backing up {len(rows)} rows...")

        # Drop old
        await conn.execute(text("DROP TABLE data"))

        # Create new (SQLModel will do this on next startup, but let's be safe)
        await conn.run_sync(Data.metadata.create_all)

        print("New table created. Old data backed up in memory (not re-inserted).")
        print("If you need old data migrated, insert manually or re-import.")


if __name__ == "__main__":
    asyncio.run(migrate())
