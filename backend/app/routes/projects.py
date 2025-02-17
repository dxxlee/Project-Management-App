from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from datetime import datetime
from ..models.project import Project, ProjectCreate
from ..utils.auth import get_current_user
from ..database import db
from ..database import get_database

router = APIRouter()


@router.post("/", response_model=Project)
async def create_project(project: ProjectCreate, current_user=Depends(get_current_user)):
    project_dict = project.model_dump()
    project_dict.update({
        "owner_id": str(current_user.id),
        "members": [str(current_user.id)],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    })

    db = get_database()
    result = await db["projects"].insert_one(project_dict)

    # Получаем созданный проект
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
        projects = await projects_cursor.to_list(length=None)  # Преобразуем курсор в список
        print("Raw Projects Data:", projects)  # Логируем сырые данные из базы данных

        # Преобразуем ObjectId в строку и добавляем поле id
        transformed_projects = []
        for project in projects:
            project["id"] = str(project["_id"])
            del project["_id"]  # Удаляем поле _id
            transformed_projects.append(Project(**project))

        return transformed_projects
    except Exception as e:
        print("Error fetching projects:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


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