"""SPA fallback route — serves index.html for client-side routing."""

import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

from config import settings

router = APIRouter()


@router.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve the React SPA index.html for any non-API route.

    This enables client-side routing (React Router) to work correctly
    when the user refreshes or directly navigates to a sub-path.
    """
    index_path = os.path.join(settings.dist_dir, "index.html")

    if not os.path.exists(index_path):
        raise HTTPException(status_code=404, detail="SPA build not found. Run `npm run build` in the frontend directory.")

    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()

    return HTMLResponse(content=content)
