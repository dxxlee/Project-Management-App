from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from ..models.project import ProjectCreate, Project
from ..models.team import Team, TeamRole, TeamUpdate, AddMemberByEmail, UpdateMemberRole
from ..utils.auth import get_current_user
from ..database import db, get_database
from bson import ObjectId

router = APIRouter()

def is_owner(team: dict, user_id: str) -> bool:
    return team["members"][0]["user_id"] == user_id

@router.post("/", response_model=Team)
async def create_team(team: Team, current_user=Depends(get_current_user)):
    db = get_database()
    team_dict = team.model_dump()
    team_dict["members"] = [{"user_id": str(current_user.id), "role": TeamRole.OWNER}]
    result = await db["teams"].insert_one(team_dict)
    team_dict["id"] = str(result.inserted_id)
    return Team(**team_dict)

@router.put("/{team_id}", response_model=Team)
async def update_team(team_id: str, team_update: TeamUpdate, current_user=Depends(get_current_user)):
    db = get_database()
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if str(current_user.id) != team["members"][0]["user_id"]:
        raise HTTPException(status_code=403, detail="You don't have permission to modify this team")
    update_dict = team_update.model_dump(exclude_unset=True)
    await db["teams"].update_one({"_id": ObjectId(team_id)}, {"$set": update_dict})
    updated_team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    updated_team["id"] = str(updated_team["_id"])
    del updated_team["_id"]
    return Team(**updated_team)

@router.delete("/{team_id}")
async def delete_team(team_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if str(current_user.id) != team["members"][0]["user_id"]:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this team")
    result = await db["teams"].delete_one({"_id": ObjectId(team_id)})
    if result.deleted_count == 1:
        return {"status": "success", "message": "Team deleted successfully"}
    raise HTTPException(status_code=500, detail="Failed to delete team")

@router.post("/{team_id}/members", response_model=Team)
async def add_team_member_by_email(team_id: str, data: AddMemberByEmail, current_user=Depends(get_current_user)):
    db = get_database()
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if str(current_user.id) != team["members"][0]["user_id"]:
        raise HTTPException(status_code=403, detail="You don't have permission to modify this team")
    user = await db["users"].find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    user_id = str(user["_id"])
    if any(member["user_id"] == user_id for member in team["members"]):
        raise HTTPException(status_code=400, detail="User is already a member of this team")
    await db["teams"].update_one({"_id": ObjectId(team_id)}, {"$addToSet": {"members": {"user_id": user_id, "role": data.role}}})
    updated_team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    updated_team["id"] = str(updated_team["_id"])
    del updated_team["_id"]
    return Team(**updated_team)

@router.get("/{team_id}/projects", response_model=List[Project])
async def get_team_projects(team_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not any(member["user_id"] == str(current_user.id) for member in team["members"]):
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    projects_cursor = db["projects"].find({"team_id": team_id})
    projects = await projects_cursor.to_list(length=None)
    transformed_projects = []
    for project in projects:
        project["id"] = str(project["_id"])
        del project["_id"]
        transformed_projects.append(Project(**project))
    return transformed_projects