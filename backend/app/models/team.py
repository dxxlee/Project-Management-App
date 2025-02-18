from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
from bson import ObjectId

class TeamRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

class TeamMember(BaseModel):
    user_id: str
    role: TeamRole = TeamRole.MEMBER  # Default role is MEMBER
    user_name: Optional[str] = None

class Team(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    name: str
    description: Optional[str] = None
    members: List[TeamMember] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class AddMemberByEmail(BaseModel):
    email: EmailStr
    role: TeamRole = TeamRole.MEMBER  # Default role is MEMBER

class UpdateMemberRole(BaseModel):  # Add this model
    role: TeamRole  # The role to update
