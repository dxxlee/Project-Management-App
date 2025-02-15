from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    team_members: List[str] = []


class Project(ProjectBase):
    id: str
    created_by: str
    team_members: List[str]
    created_at: datetime
    updated_at: Optional[datetime] = None