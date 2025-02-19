from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI

app = FastAPI()  # Убедись, что у тебя есть объект FastAPI

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    team_id: Optional[str] = None   # Добавляем связь с командой

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: Optional[str] = None
    owner_id: Optional[str] = None
    members: Optional[List[str]] = []
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    team_name: Optional[str] = None  # Add team_name to the model

    class Config:
        populate_by_name = True

@app.on_event("startup")
async def create_indexes():
    from app.db import db  # Импортируем db внутри функции, чтобы избежать циклического импорта
    await db["projects"].create_index([("members", 1)])
    await db["projects"].create_index([("team_id", 1)])