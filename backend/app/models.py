from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Модель пользователя
class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr
    hashed_password: str

# Модель задачи
class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str = "To Do"
    assigned_to: Optional[str] = None  # ID пользователя
    created_at: datetime = datetime.utcnow()
