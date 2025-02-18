from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

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
