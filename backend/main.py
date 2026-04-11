"""FastAPI application entry point."""

import os
import sys

# Ensure the backend directory is on sys.path so local imports work
sys.path.insert(0, os.path.dirname(__file__))

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from config import settings
from database import create_db_and_tables
from routers import items_router, export_router, spa_router
from error_handlers import register_error_handlers
from auth import API_KEY


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

    # ── Static Files (frontend build) ──────────────────────────────────
    dist_path = os.path.join(os.path.dirname(__file__), settings.dist_dir)
    if os.path.exists(dist_path):
        app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
        
        # Serve vite.svg and other root static files
        from fastapi.responses import FileResponse
        
        @app.get("/vite.svg", include_in_schema=False)
        async def serve_vite_svg():
            svg_path = os.path.join(dist_path, "vite.svg")
            if os.path.exists(svg_path):
                return FileResponse(svg_path, media_type="image/svg+xml")
            raise HTTPException(status_code=404, detail="File not found")

    app.include_router(spa_router)

    # ── Auth Info Endpoint ─────────────────────────────────────────────
    @app.get("/api/auth/info", tags=["auth"])
    async def auth_info():
        """Get API authentication info (for setup purposes)."""
        return {
            "auth_type": "api_key",
            "api_key": API_KEY,
            "message": "Include this key in X-API-Key header for protected endpoints",
        }

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
