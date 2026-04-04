import os
import asyncio
import re
import sys # Tambahkan ini
from sqlalchemy import text
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

# FIX UNTUK WINDOWS
if os.name == 'nt':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

load_dotenv()

async def async_main() -> None:
    raw_url = os.getenv('DATABASE_URL')
    if not raw_url:
        print("Error: DATABASE_URL tidak ditemukan di file .env")
        return

    # Menggunakan +psycopg sesuai kode Anda sebelumnya
    async_url = re.sub(r'^postgresql:', 'postgresql+psycopg:', raw_url)
    
    try:
        engine = create_async_engine(async_url, echo=True)
        
        async with engine.connect() as conn:
            result = await conn.execute(text("select 'Koneksi Neon Berhasil!'"))
            print(f"\n--- HASIL QUERY: {result.fetchall()} ---\n")
            
        await engine.dispose()
    except Exception as e:
        print(f"Terjadi kesalahan koneksi: {e}")

if __name__ == "__main__":
    asyncio.run(async_main())