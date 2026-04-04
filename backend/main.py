"""FastAPI application entry point."""

import os
import sys

# Ensure the backend directory is on sys.path so local imports work
sys.path.insert(0, os.path.dirname(__file__))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import settings
from database import create_db_and_tables
from routers import items_router, export_router, spa_router
from error_handlers import register_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — runs on startup and shutdown."""
    await create_db_and_tables()
    yield


def create_app() -> FastAPI:
    """Application factory."""

    app = FastAPI(
        title="QR Input API",
        description="Inventory management system with QR code scanning.",
        version="2.0.0",
        lifespan=lifespan,
    )

    # ── CORS ───────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

    # ── Routes ─────────────────────────────────────────────────────────
    app.include_router(items_router)
    app.include_router(export_router)
    app.include_router(spa_router)

    # ── Error handlers ─────────────────────────────────────────────────
    register_error_handlers(app)

    return app


app = create_app()


if __name__ == "__main__":
    ssl_config = {}
    if settings.ssl_keyfile and settings.ssl_certfile:
        ssl_config = {
            "ssl_keyfile": settings.ssl_keyfile,
            "ssl_certfile": settings.ssl_certfile,
        }

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        **ssl_config,
    )
