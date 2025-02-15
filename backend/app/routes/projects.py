from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from ..models.project import Project
from ..utils.auth import get_current_user
from ..database import db

router = APIRouter()


@router.post("/", response_model=Project)
async def create_project(project: Project, current_user=Depends(get_current_user)):
    """Создание нового проекта"""
    project_dict = project.model_dump()
    project_dict["owner_id"] = str(current_user.id)
    project_dict["members"] = [str(current_user.id)]

    result = await db.client.projects.insert_one(project_dict)
    project_dict["id"] = str(result.inserted_id)
    return Project(**project_dict)


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    """Получение информации о проекте"""
    # Проверяем доступ пользователя к проекту
    project = await db.client.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if str(current_user.id) not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Access denied")

    return Project(**project)


@router.put("/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: Project, current_user=Depends(get_current_user)):
    """Обновление проекта"""
    # Проверяем доступ пользователя к проекту
    project = await db.client.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if str(current_user.id) != project.get("owner_id"):
        raise HTTPException(status_code=403, detail="Only project owner can update project")

    update_dict = project_update.model_dump(exclude_unset=True)
    result = await db.client.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_dict}
    )

    updated_project = await db.client.projects.find_one({"_id": ObjectId(project_id)})
    return Project(**updated_project)


@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user=Depends(get_current_user)):
    """Удаление проекта"""
    # Проверяем доступ пользователя к проекту
    project = await db.client.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if str(current_user.id) != project.get("owner_id"):
        raise HTTPException(status_code=403, detail="Only project owner can delete project")

    result = await db.client.projects.delete_one({"_id": ObjectId(project_id)})
    return {"status": "success", "message": "Project deleted successfully"}


@router.get("/", response_model=List[Project])
async def get_user_projects(current_user=Depends(get_current_user)):
    """Получение всех проектов пользователя"""
    projects = await db.client.projects.find({
        "members": str(current_user.id)
    }).to_list(None)

    return [Project(**project) for project in projects]


@router.post("/{project_id}/members/{user_id}")
async def add_project_member(project_id: str, user_id: str, current_user=Depends(get_current_user)):
    """Добавление участника в проект"""
    # Проверяем права доступа
    project = await db.client.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if str(current_user.id) != project.get("owner_id"):
        raise HTTPException(status_code=403, detail="Only project owner can add members")

    # Проверяем существование пользователя
    user = await db.client.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.client.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$addToSet": {"members": user_id}}
    )

    return {"status": "success", "message": "Member added successfully"}