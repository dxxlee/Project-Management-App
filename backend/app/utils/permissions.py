from fastapi import HTTPException
from bson import ObjectId
from ..database import get_database

async def check_project_permissions(project_id: str, user_id: str, required_roles=None):
    """Проверка прав пользователя в проекте и команде"""
    db = get_database()
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.get("team_id"):
        team = await db["teams"].find_one({"_id": ObjectId(project["team_id"])})
        if team:
            for member in team["members"]:
                if member["user_id"] == user_id:
                    if required_roles and member["role"] in required_roles:
                        return True
                    elif not required_roles:
                        return True
    
    if project.get("owner_id") == user_id:
        return True
        
    if user_id in project.get("members", []):
        return True
        
    raise HTTPException(status_code=403, detail="You don't have permission for this action")

async def check_team_permissions(team_id: str, user_id: str, required_roles=None):
    """Проверка прав пользователя в команде"""
    db = get_database()
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    for member in team["members"]:
        if member["user_id"] == user_id:
            if required_roles and member["role"] in required_roles:
                return True
            elif not required_roles:
                return True
    
    raise HTTPException(status_code=403, detail="You don't have permission for this action")

async def check_task_permissions(task_id: str, user_id: str, required_roles=None):
    """Проверка прав пользователя для работы с задачей"""
    db = get_database()
    task = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await check_project_permissions(task["project_id"], user_id, required_roles)
    
    return task