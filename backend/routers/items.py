"""Item CRUD routes.

Only depends on the service layer. No repository or session imports.
"""

from math import ceil

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from database import get_session
from schemas import DataCreate, DataUpdate, DataResponse, DataListResponse
from repository import DataRepository
from service import DataService

router = APIRouter(prefix="/api/data", tags=["items"])


def get_data_service(session: AsyncSession = Depends(get_session)) -> DataService:
    """FastAPI dependency that provides a DataService instance."""
    return DataService(DataRepository(session))


@router.post("/", response_model=DataResponse, status_code=201)
async def create_item(
    payload: DataCreate,
    svc: DataService = Depends(get_data_service),
):
    """Create a new inventory item. Returns 409 if QR code already exists."""
    existing = await svc.get_by_qr(qr_code=payload.qr_code)
    if existing:
        raise HTTPException(status_code=409, detail="qr_code already exists")
    return await svc.create_item(payload)


@router.get("/", response_model=DataListResponse)
async def list_items(
    page: int = 1,
    limit: int = 10,
    q: str | None = None,
    svc: DataService = Depends(get_data_service),
):
    """List items with pagination and optional search."""
    items, total = await svc.list_items(page=page, limit=limit, search=q)
    return DataListResponse(
        data=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=ceil(total / limit) if total else 0,
    )


@router.get("/{item_id}", response_model=DataResponse)
async def get_item(
    item_id: int,
    svc: DataService = Depends(get_data_service),
):
    """Get a single item by ID."""
    obj = await svc.get_item(item_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Item not found")
    return obj


@router.get("/qr/{qr_code}", response_model=DataResponse)
async def get_item_by_qr(
    qr_code: str,
    svc: DataService = Depends(get_data_service),
):
    """Get a single item by QR code."""
    obj = await svc.get_by_qr(qr_code)
    if not obj:
        raise HTTPException(status_code=404, detail="Item not found")
    return obj


@router.put("/{item_id}", response_model=DataResponse)
async def update_item(
    item_id: int,
    payload: DataUpdate,
    svc: DataService = Depends(get_data_service),
):
    """Update an existing item (partial update)."""
    obj = await svc.update_item(item_id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Item not found")
    return obj


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: int,
    svc: DataService = Depends(get_data_service),
):
    """Delete an item."""
    deleted = await svc.delete_item(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
