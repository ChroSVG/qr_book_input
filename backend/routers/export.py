"""Data export routes (CSV and Excel).

Only depends on the service layer. No repository or session imports.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from database import get_session
from repository import DataRepository
from service import DataService
from utils.export import generate_csv, generate_excel

router = APIRouter(prefix="/api/data/export", tags=["export"])


def get_data_service(session: AsyncSession = Depends(get_session)) -> DataService:
    """FastAPI dependency that provides a DataService instance."""
    return DataService(DataRepository(session))


@router.get("/csv")
async def export_csv(svc: DataService = Depends(get_data_service)):
    """Export all data as CSV with UTF-8 BOM encoding."""
    items = await svc.fetch_all_items()
    csv_bytes = generate_csv(items)

    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=data_export.csv"},
    )


@router.get("/excel")
async def export_excel(svc: DataService = Depends(get_data_service)):
    """Export all data as Excel (.xlsx)."""
    items = await svc.fetch_all_items()
    excel_bytes = generate_excel(items)

    return StreamingResponse(
        iter([excel_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=data_export.xlsx"},
    )
