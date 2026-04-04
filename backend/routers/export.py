"""Data export routes (CSV and Excel).

Only depends on the service layer. No repository or session imports.
"""

import io
import csv

import openpyxl
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from database import get_session
from repository import DataRepository
from service import DataService

router = APIRouter(prefix="/api/data/export", tags=["export"])


def get_data_service(session: AsyncSession = Depends(get_session)) -> DataService:
    """FastAPI dependency that provides a DataService instance."""
    return DataService(DataRepository(session))


@router.get("/csv")
async def export_csv(svc: DataService = Depends(get_data_service)):
    """Export all data as CSV with UTF-8 BOM encoding."""
    items = await svc.fetch_all_items()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "qr_code", "name", "description", "extra_info", "created_at", "updated_at"])

    for item in items:
        writer.writerow([
            item.id,
            item.qr_code,
            item.name,
            item.description or "",
            item.extra_info or "",
            item.created_at.isoformat(),
            item.updated_at.isoformat(),
        ])

    csv_bytes = ("\ufeff" + output.getvalue()).encode("utf-8")

    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=data_export.csv"},
    )


@router.get("/excel")
async def export_excel(svc: DataService = Depends(get_data_service)):
    """Export all data as Excel (.xlsx)."""
    items = await svc.fetch_all_items()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["id", "qr_code", "name", "description", "extra_info", "created_at", "updated_at"])

    for item in items:
        ws.append([
            item.id,
            item.qr_code,
            item.name,
            item.description or "",
            item.extra_info or "",
            item.created_at.isoformat(),
            item.updated_at.isoformat(),
        ])

    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)

    return StreamingResponse(
        bio,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=data_export.xlsx"},
    )
