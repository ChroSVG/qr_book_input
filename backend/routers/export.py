"""Data export routes (CSV and Excel).

Supports both API key (legacy) and JWT authentication.
Tracks downloads when user is authenticated via JWT.
"""

from datetime import datetime, UTC
from typing import Optional
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from database import get_session
from repository import DataRepository
from service import DataService
from utils.export import generate_csv, generate_excel
from auth import verify_api_key_optional, oauth2_scheme, verify_token
from models import User, DownloadLog

router = APIRouter(prefix="/api/data/export", tags=["export"])


def get_data_service(session: AsyncSession = Depends(get_session)) -> DataService:
    """FastAPI dependency that provides a DataService instance."""
    return DataService(DataRepository(session))


async def get_optional_user(
    api_key: Optional[str] = Depends(verify_api_key_optional),
    token: Optional[str] = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> Optional[User]:
    """Get user if authenticated with JWT, otherwise None."""
    # Try JWT authentication first
    if token:
        try:
            payload = verify_token(token)
            user_id_str = payload.get("sub")
            if user_id_str is not None:
                user_id = int(user_id_str)
            else:
                raise ValueError("sub claim missing")
            
            from sqlmodel import select
            stmt = select(User).where(User.id == user_id)
            result = await session.exec(stmt)
            user = result.first()
            
            if user and user.is_active:
                return user
        except Exception:
            pass
    
    # API key authentication (no user tracking)
    if api_key:
        return None
    
    return None


async def track_download(
    user: Optional[User],
    file_type: str,
    filename: str,
    ip_address: Optional[str],
    session: AsyncSession,
):
    """Track download if user is authenticated."""
    if user:
        download_log = DownloadLog(
            user_id=user.id,  # type: ignore
            file_type=file_type,
            filename=filename,
            ip_address=ip_address,
            downloaded_at=datetime.now(UTC),
        )
        session.add(download_log)
        await session.commit()


@router.get("/csv")
async def export_csv(
    request: Request,
    svc: DataService = Depends(get_data_service),
    user: Optional[User] = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
):
    """Export all data as CSV with UTF-8 BOM encoding."""
    items = await svc.fetch_all_items()
    csv_bytes = generate_csv(items)

    # Track download if user is authenticated
    ip_address = request.client.host if request.client else None
    await track_download(user, "csv", "data_export.csv", ip_address, session)

    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=data_export.csv"},
    )


@router.get("/excel")
async def export_excel(
    request: Request,
    svc: DataService = Depends(get_data_service),
    user: Optional[User] = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
):
    """Export all data as Excel (.xlsx)."""
    items = await svc.fetch_all_items()
    excel_bytes = generate_excel(items)

    # Track download if user is authenticated
    ip_address = request.client.host if request.client else None
    await track_download(user, "excel", "data_export.xlsx", ip_address, session)

    return StreamingResponse(
        iter([excel_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=data_export.xlsx"},
    )
