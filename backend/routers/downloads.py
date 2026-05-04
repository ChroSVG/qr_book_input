"""Download tracking routes - log and retrieve download history."""

from datetime import datetime, UTC
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from database import get_session
from models import User, DownloadLog
from schemas import DownloadLogResponse, DownloadHistoryResponse
from auth import oauth2_scheme, verify_token, SECRET_KEY
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/downloads", tags=["downloads"])


async def get_current_user_with_logging(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Get current authenticated user with debug logging."""
    from fastapi import HTTPException, status
    from sqlmodel import select
    
    try:
        print(f"\n🔐 [Auth Debug] Token received (first 30 chars): {token[:30]}...")
        print(f"🔐 [Auth Debug] SECRET_KEY loaded: {'YES' if SECRET_KEY else 'NO'}")
        print(f"🔐 [Auth Debug] SECRET_KEY first 20 chars: {SECRET_KEY[:20]}...")
        
        payload = verify_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        user_id = int(user_id_str)
        print(f"🔐 [Auth Debug] Token decoded, user_id: {user_id}")
        print(f"🔐 [Auth Debug] Token payload: {payload}")
        
        # Query user from database
        statement = select(User).where(User.id == user_id)
        result = await session.exec(statement)
        user = result.first()
        
        if user is None:
            print(f"❌ [Auth Debug] User not found in DB: id={user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        if not user.is_active:
            print(f"❌ [Auth Debug] User is not active: id={user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is disabled",
            )
        
        print(f"✅ [Auth Debug] User authenticated: {user.username}")
        return user
        
    except Exception as e:
        print(f"❌ [Auth Debug] Exception: {type(e).__name__}: {e}")
        raise


async def log_download(
    user: User,
    file_type: str,
    filename: Optional[str],
    session: AsyncSession,
):
    """Log a download to the database."""
    download_log = DownloadLog(
        user_id=user.id,  # type: ignore
        file_type=file_type,
        filename=filename,
        downloaded_at=datetime.now(UTC),
    )
    session.add(download_log)
    await session.commit()


@router.get("/history", response_model=DownloadHistoryResponse)
async def get_download_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user_with_logging),
    session: AsyncSession = Depends(get_session),
):
    """Get download history for current user."""
    # Get total count
    count_stmt = select(func.count()).where(
        DownloadLog.user_id == user.id
    )
    total = (await session.exec(count_stmt)).one()

    # Get downloads with pagination
    offset = (page - 1) * limit
    stmt = (
        select(DownloadLog)
        .where(DownloadLog.user_id == user.id)
        .order_by(DownloadLog.downloaded_at.desc())  # type: ignore
        .offset(offset)
        .limit(limit)
    )
    result = await session.exec(stmt)
    downloads = result.all()

    return DownloadHistoryResponse(
        downloads=[DownloadLogResponse.model_validate(d) for d in downloads],
        total=total,
    )


@router.delete("/history/{download_id}", status_code=204)
async def delete_download_log(
    download_id: int,
    user: User = Depends(get_current_user_with_logging),
    session: AsyncSession = Depends(get_session),
):
    """Delete a download log entry."""
    stmt = select(DownloadLog).where(
        DownloadLog.id == download_id,
        DownloadLog.user_id == user.id,
    )
    result = await session.exec(stmt)
    log = result.first()

    if not log:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Download log not found",
        )

    await session.delete(log)
    await session.commit()
