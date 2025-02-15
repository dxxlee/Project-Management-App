from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from bson import ObjectId
from ..models.task import Task, TaskStatus, TaskPriority  # Импортируем модели
from ..utils.auth import get_current_user
from ..database import db

router = APIRouter()


@router.post("/{project_id}/tasks", response_model=Task)
async def create_task(
        project_id: str,
        task: Task,
        current_user=Depends(get_current_user)
):
    """Создание новой задачи"""
    # Проверяем существование проекта
    project = await db.client.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task_dict = task.model_dump()
    task_dict["project_id"] = project_id
    task_dict["reporter_id"] = current_user.id
    task_dict["created_at"] = datetime.utcnow()

    result = await db.client.tasks.insert_one(task_dict)
    task_dict["id"] = str(result.inserted_id)
    return Task(**task_dict)


@router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user=Depends(get_current_user)):
    """Получение информации о задаче"""
    task = await db.client.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**task)


@router.put("/tasks/{task_id}", response_model=Task)
async def update_task(
        task_id: str,
        task_update: Task,
        current_user=Depends(get_current_user)
):
    """Обновление задачи"""
    # Проверяем существование задачи
    task = await db.client.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_dict = task_update.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()

    result = await db.client.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_dict}
    )

    updated_task = await db.client.tasks.find_one({"_id": ObjectId(task_id)})
    return Task(**updated_task)


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user=Depends(get_current_user)):
    """Удаление задачи"""
    result = await db.client.tasks.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": "Task deleted successfully"}


@router.get("/project/{project_id}/tasks", response_model=List[Task])
async def get_project_tasks(
        project_id: str,
        current_user=Depends(get_current_user)
):
    """Получение всех задач проекта"""
    tasks = await db.client.tasks.find(
        {"project_id": project_id}
    ).to_list(None)
    return [Task(**task) for task in tasks]


@router.put("/tasks/{task_id}/status")
async def update_task_status(
        task_id: str,
        status: TaskStatus,
        current_user=Depends(get_current_user)
):
    """Обновление статуса задачи"""
    result = await db.client.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.utcnow()
            }
        }
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": "Task status updated"}


@router.put("/tasks/{task_id}/assign")
async def assign_task(
        task_id: str,
        assignee_id: str,
        current_user=Depends(get_current_user)
):
    """Назначение задачи пользователю"""
    # Проверяем существование пользователя
    user = await db.client.users.find_one({"_id": ObjectId(assignee_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.client.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {
                "assignee_id": assignee_id,
                "updated_at": datetime.utcnow()
            }
        }
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": "Task assigned successfully"}