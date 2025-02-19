from fastapi import APIRouter, Depends, HTTPException, Query, FastAPI
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from ..models.task import Task, TaskStatus, TaskPriority
from ..utils.auth import get_current_user
from ..database import get_database
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from pydantic import ValidationError
from fastapi import Query


router = APIRouter()

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# =========================================================
#  ФУНКЦИЯ ПРОВЕРКИ ПРАВ ПОЛЬЗОВАТЕЛЯ В ПРОЕКТЕ/КОМАНДЕ
# =========================================================
async def check_project_permissions(project_id: str, user_id: str, required_roles=None):
    """
    Проверка прав пользователя user_id в проекте project_id.
    Если required_roles не задан, достаточно быть участником.
    Если задан, проверяем, что у пользователя роль из required_roles (owner/admin).
    """
    db = get_database()
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Если проект привязан к команде, проверяем роль пользователя в команде
    team_id = project.get("team_id")
    if team_id:
        team = await db["teams"].find_one({"_id": ObjectId(team_id)})
        if team:
            for member in team["members"]:
                if member["user_id"] == user_id:
                    # Если требуются конкретные роли:
                    if required_roles:
                        if member["role"] in required_roles:
                            return True
                        else:
                            raise HTTPException(status_code=403, detail="You don't have permission for this action")
                    else:
                        # Если роль не требуется, достаточно быть в команде
                        return True

    # Если нет команды или пользователь не найден в ней, проверяем сам проект
    # (владелец проекта или хотя бы член проекта)
    if project.get("owner_id") == user_id:
        return True
    if user_id in project.get("members", []):
        return True

    raise HTTPException(status_code=403, detail="You don't have permission for this action")


# =========================================================
#  СОЗДАНИЕ ЗАДАЧИ
# =========================================================
@router.post("/projects/{project_id}/tasks", response_model=Task)
async def create_task(
    project_id: str,
    task: Task,
    current_user=Depends(get_current_user)
):
    """
    Создание новой задачи (Task) в проекте project_id.
    """
    db = get_database()

    try:
        # Проверяем, что пользователь хотя бы участник проекта
        await check_project_permissions(project_id, str(current_user.id))

        if not task.title:
            raise HTTPException(status_code=422, detail="Task title is required")

        # Формируем словарь для вставки в базу
        task_dict = task.model_dump(exclude_unset=True)
        task_dict.update({
            "project_id": project_id,
            "reporter_id": str(current_user.id),
            "created_at": datetime.utcnow(),
            "status": task.status or TaskStatus.TODO,
            "priority": task.priority or TaskPriority.MEDIUM,
            "labels": task.labels or [],
            "comments": task.comments or []
        })

        result = await db["tasks"].insert_one(task_dict)
        task_dict["id"] = str(result.inserted_id)
        return Task(**task_dict)

    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
#  ПОЛУЧЕНИЕ ЗАДАЧ ПРОЕКТА
# =========================================================
@router.get("/projects/{project_id}/tasks", response_model=List[Task])
async def get_project_tasks(
    project_id: str,
    skip: int = Query(0),
    limit: int = Query(50),
    current_user=Depends(get_current_user)
):
    """
    Возвращает задачи проекта project_id (с пагинацией).
    """
    db = get_database()
    # Проверяем, что пользователь хотя бы участник
    await check_project_permissions(project_id, str(current_user.id))

    tasks_cursor = db["tasks"].find({"project_id": project_id}).skip(skip).limit(limit)
    tasks_list = await tasks_cursor.to_list(None)

    # Преобразуем _id -> id
    for t in tasks_list:
        t["id"] = str(t["_id"])
        del t["_id"]

    return [Task(**t) for t in tasks_list]


# =========================================================
#  ПОЛУЧЕНИЕ ОДНОЙ ЗАДАЧИ
# =========================================================
@router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user=Depends(get_current_user)):
    """
    Получение информации о задаче по её ID.
    """
    db = get_database()
    task_data = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")

    # Проверяем, что пользователь хотя бы участник проекта
    await check_project_permissions(task_data["project_id"], str(current_user.id))

    task_data["id"] = str(task_data["_id"])
    del task_data["_id"]
    return Task(**task_data)


# =========================================================
#  ОБНОВЛЕНИЕ ОДНОЙ ЗАДАЧИ (с правами)
# =========================================================
@router.put("/tasks/{task_id}", response_model=Task)
async def update_task_with_permissions(
    task_id: str,
    task_update: Task,
    current_user=Depends(get_current_user)
):
    """
    Обновление задачи. Если пользователь не admin/owner, он может менять только status своих задач.
    """
    db = get_database()
    user_id = str(current_user.id)

    # Находим задачу
    existing_task = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")

    project_id = existing_task["project_id"]
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Проверяем, есть ли у пользователя роль owner/admin
    is_admin = False
    team_id = project.get("team_id")
    if team_id:
        team = await db["teams"].find_one({"_id": ObjectId(team_id)})
        if team:
            for member in team["members"]:
                if member["user_id"] == user_id and member["role"] in ["owner", "admin"]:
                    is_admin = True
                    break
    else:
        # Если нет команды, проверяем, является ли пользователь владельцем проекта
        if project.get("owner_id") == user_id:
            is_admin = True

    # Если пользователь не админ, он может менять только статус своих задач
    update_data = task_update.model_dump(exclude_unset=True)
    if not is_admin:
        # Проверяем, что задача назначена на него
        if existing_task.get("assignee_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only update tasks assigned to you"
            )
        # Разрешаем менять только поле 'status'
        allowed_fields = {"status"}
        if not set(update_data.keys()).issubset(allowed_fields):
            raise HTTPException(
                status_code=403,
                detail="You can only update task status"
            )

    # Обновляем задачу
    update_data["updated_at"] = datetime.utcnow()
    await db["tasks"].update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )

    # Возвращаем обновлённый документ
    updated = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    updated["id"] = str(updated["_id"])
    del updated["_id"]
    return Task(**updated)


# =========================================================
#  УДАЛЕНИЕ ЗАДАЧИ
# =========================================================
@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user=Depends(get_current_user)):
    """
    Удаление задачи. Настройте права при необходимости (ниже только владелец проекта).
    """
    db = get_database()
    user_id = str(current_user.id)

    # Ищем задачу
    task_data = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")

    project_id = task_data["project_id"]
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Проверяем, что только владелец проекта может удалять
    if project.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Only project owner can delete tasks")

    result = await db["tasks"].delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": "Task deleted successfully"}


# =========================================================
#  ОБНОВЛЕНИЕ СТАТУСА ЗАДАЧИ
# =========================================================


    
@router.put("/tasks/{task_id}/status")
async def update_task_status(
    task_id: str,
    # status: TaskStatus,
    status: TaskStatus = Query(...),
    current_user=Depends(get_current_user)
):
    """
    Обновление статуса задачи (todo, in_progress, review, done).
    """
    
    db = get_database()
    # Ищем задачу
    task_data = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")

    # Проверяем, что пользователь хотя бы участник
    await check_project_permissions(task_data["project_id"], str(current_user.id))

    # Обновляем статус
    result = await db["tasks"].update_one(
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


# =========================================================
#  ВСЕ ЗАДАЧИ ПОЛЬЗОВАТЕЛЯ
# =========================================================
@router.get("/user/tasks", response_model=List[Task])
async def get_user_tasks(current_user=Depends(get_current_user)):
    """
    Получение всех задач пользователя (где он участник проекта или assignee).
    """
    db = get_database()
    user_id = str(current_user.id)

    # Находим все проекты, где user_id в members
    projects_cursor = db["projects"].find({"members": user_id})
    projects_list = await projects_cursor.to_list(None)
    project_ids = [str(p["_id"]) for p in projects_list]

    # Ищем задачи, либо где project_id в project_ids, либо assignee_id == user_id
    tasks_cursor = db["tasks"].find({
        "$or": [
            {"project_id": {"$in": project_ids}},
            {"assignee_id": user_id}
        ]
    })
    tasks_list = await tasks_cursor.to_list(None)

    for t in tasks_list:
        t["id"] = str(t["_id"])
        del t["_id"]

    return [Task(**t) for t in tasks_list]


# =========================================================
#  МАССОВОЕ СОЗДАНИЕ ЗАДАЧ (для членов проекта)
# =========================================================
@router.post("/projects/{project_id}/tasks/bulk", response_model=List[Task])
async def create_tasks_for_members(
    project_id: str,
    task: Task,
    assign_to_all: bool = Query(False),
    member_ids: Optional[List[str]] = Query(None),
    current_user=Depends(get_current_user)
):
    """
    Создаёт копию задачи для каждого участника (assign_to_all)
    или для конкретного списка member_ids. Только owner/admin.
    """
    db = get_database()
    user_id = str(current_user.id)

    # Проверяем права (owner/admin)
    await check_project_permissions(project_id, user_id, required_roles=["owner", "admin"])

    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Определяем, кому назначаем
    if assign_to_all:
        assignees = project.get("members", [])
    elif member_ids:
        # Проверяем, что все member_ids - участники проекта
        for m in member_ids:
            if m not in project.get("members", []):
                raise HTTPException(
                    status_code=400,
                    detail=f"User {m} is not a member of the project"
                )
        assignees = member_ids
    else:
        assignees = []

    created_tasks = []
    for assignee in assignees:
        task_dict = task.model_dump(exclude_unset=True)
        task_dict.update({
            "project_id": project_id,
            "reporter_id": user_id,
            "assignee_id": assignee,
            "created_at": datetime.utcnow()
        })
        result = await db["tasks"].insert_one(task_dict)
        task_dict["id"] = str(result.inserted_id)
        created_tasks.append(Task(**task_dict))

    return created_tasks


# =========================================================
#  НАЗНАЧЕНИЕ ЗАДАЧИ ПОЛЬЗОВАТЕЛЮ
# =========================================================
@router.put("/tasks/{task_id}/assign")
async def assign_task(
    task_id: str,
    assignee_id: str,
    current_user=Depends(get_current_user)
):
    """
    Назначение задачи пользователю (assignee_id).
    Только владелец/админ может переназначать задачу (при желании уточните логику).
    """
    db = get_database()
    user_id = str(current_user.id)

    # Ищем задачу
    task_data = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")

    project_id = task_data["project_id"]
    # Проверяем, что текущий пользователь - owner/admin
    await check_project_permissions(project_id, user_id, required_roles=["owner", "admin"])

    # Проверяем, что assignee_id существует
    user_to_assign = await db["users"].find_one({"_id": ObjectId(assignee_id)})
    if not user_to_assign:
        raise HTTPException(status_code=404, detail="User not found")

    # Обновляем
    result = await db["tasks"].update_one(
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
