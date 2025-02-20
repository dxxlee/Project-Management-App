from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from datetime import datetime
from ..models.project import Project, ProjectCreate
from ..utils.auth import get_current_user
from ..database import db
from ..database import get_database

router = APIRouter()


async def get_team_name(team_id: str) -> str:
    """Helper function to fetch team name by ID."""
    db = get_database()
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if team:
        return team["name"]
    return "No Team"

@router.post("/", response_model=Project)
async def create_project(project: ProjectCreate, current_user=Depends(get_current_user)):
    project_dict = project.model_dump()

    if project_dict.get("team_id"):
        db = get_database()
        team = await db["teams"].find_one({"_id": ObjectId(project_dict["team_id"])})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        allowed_roles = ["owner", "admin"]
        user_roles = [member["role"] for member in team["members"] if member["user_id"] == str(current_user.id)]
        if not any(role in allowed_roles for role in user_roles):
            raise HTTPException(status_code=403, detail="You don't have permission to create a project for this team")

    project_dict.update({
        "owner_id": str(current_user.id),
        "members": [str(current_user.id)],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    })

    db = get_database()
    result = await db["projects"].insert_one(project_dict)
    created_project = await db["projects"].find_one({"_id": result.inserted_id})
    if created_project:
        created_project["id"] = str(created_project["_id"])
        del created_project["_id"]
        return Project(**created_project)

    raise HTTPException(status_code=500, detail="Failed to create project")


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    """Получение информации о проекте"""
    db = get_database()
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(current_user.id) not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Access denied")
    project["id"] = str(project["_id"])
    del project["_id"]
    return Project(**project)


@router.put("/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: Project, current_user=Depends(get_current_user)):
    """Обновление проекта"""
    db = get_database()
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(current_user.id) != project.get("owner_id"):
        raise HTTPException(status_code=403, detail="Only project owner can update project")
    update_dict = project_update.model_dump(exclude_unset=True)
    result = await db["projects"].update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_dict}
    )
    updated_project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    updated_project["id"] = str(updated_project["_id"])
    del updated_project["_id"]
    return Project(**updated_project)


@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user=Depends(get_current_user)):
    """Удаление проекта"""
    db = get_database()
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(current_user.id) != project.get("owner_id"):
        raise HTTPException(status_code=403, detail="Only project owner can delete project")
    result = await db["projects"].delete_one({"_id": ObjectId(project_id)})
    if result.deleted_count == 1:
        return {"status": "success", "message": "Project deleted successfully"}
    raise HTTPException(status_code=500, detail="Failed to delete project")


@router.get("/", response_model=List[Project])
async def get_user_projects(current_user=Depends(get_current_user)):
    """Получение всех проектов пользователя"""
    try:
        db = get_database()
        projects_cursor = db["projects"].find({"members": str(current_user.id)})
        projects = await projects_cursor.to_list(length=None)  
        print("Raw Projects Data:", projects) 

        transformed_projects = []
        for project in projects:
            project["id"] = str(project["_id"])
            del project["_id"] 

            # Add team name to the project
            team_id = project.get("team_id")
            if team_id:
                project["team_name"] = await get_team_name(team_id)
            else:
                project["team_name"] = "No Team"

            transformed_projects.append(Project(**project))

        return transformed_projects
    except Exception as e:
        print("Error fetching projects:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{project_id}/members/{user_id}")
async def add_project_member(project_id: str, user_id: str, current_user=Depends(get_current_user)):
    """Добавление участника в проект"""
    project = await db.client.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if str(current_user.id) != project.get("owner_id"):
        raise HTTPException(status_code=403, detail="Only project owner can add members")

    user = await db.client.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.client.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$addToSet": {"members": user_id}}
    )

    return {"status": "success", "message": "Member added successfully"}