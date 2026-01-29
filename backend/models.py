# file: backend/models.py
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class DataBase(SQLModel):
    qr_code: str = Field(index=True)
    name: str
    description: Optional[str] = None
    extra_info: Optional[str] = None

# class DataBase(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     qr_code: str = Field(index=True, unique=True)
#     name: str
#     description: Optional[str] = None
#     extra_info: Optional[str] = None
class Data(DataBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


