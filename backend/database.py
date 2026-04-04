import os
import asyncio
import re
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 1. WAJIB UNTUK WINDOWS (Tambahkan ini paling atas)
if os.name == 'nt':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

load_dotenv()

# 2. Ambil URL dan konversi driver ke psycopg
raw_url = os.getenv("DATABASE_URL")

if raw_url:
    # Mengubah postgresql:// menjadi postgresql+psycopg://
    DATABASE_URL = re.sub(r'^postgresql:', 'postgresql+psycopg:', raw_url)
else:
    # Jika .env gagal terbaca, kita beri peringatan daripada error sqlite
    raise ValueError("DATABASE_URL tidak ditemukan! Pastikan file .env ada di folder backend/")

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def create_db_and_tables():
    async with engine.begin() as conn:
        # Ini akan membuat tabel di Neon Tech
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session():
    async with async_session() as session:
        yield session