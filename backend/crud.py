# file: backend/crud.py
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from models import Data
from typing import List, Optional, Tuple
from datetime import datetime

async def create_data(session: AsyncSession, *, obj_in: dict) -> Data:
    data = Data(**obj_in)
    session.add(data)
    await session.commit()
    await session.refresh(data)
    return data

async def get_data(session: AsyncSession, *, page: int =1, limit: int =10, q: Optional[str]=None) -> Tuple[List[Data], int]:
    stmt = select(Data)
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Data.qr_code.ilike(like)) | (Data.name.ilike(like)))
    total = (await session.exec(stmt)).all()
    total_count = len(total)
    stmt = stmt.offset((page-1)*limit).limit(limit)
    items = (await session.exec(stmt)).all()
    return items, total_count

async def get_one(session: AsyncSession, *, id: int) -> Optional[Data]:
    return await session.get(Data, id)

async def get_by_qr(session: AsyncSession, *, qr_code: str) -> Optional[Data]:
    stmt = select(Data).where(Data.qr_code == qr_code)
    res = await session.exec(stmt)
    return res.first()

async def update_data(session: AsyncSession, *, db_obj: Data, obj_in: dict) -> Data:
    for k, v in obj_in.items():
        if hasattr(db_obj, k) and v is not None:
            setattr(db_obj, k, v)
    db_obj.updated_at = datetime.utcnow()
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj

async def delete_data(session: AsyncSession, *, db_obj: Data) -> None:
    await session.delete(db_obj)
    await session.commit()
