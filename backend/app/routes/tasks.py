from fastapi import APIRouter, Depends, HTTPException, Query, FastAPI
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from ..models.task import Task, TaskStatus, TaskPriority  # Импорт моделей
from ..utils.auth import get_current_user
from ..database import db, get_database
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address  # Импорт функции get_remote_address

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

router = APIRouter()


@router.post("/{project_id}/tasks", response_model=Task)
async def create_task(
    project_id: str,
    task: Task,
    assignees: Optional[List[str]] = Query(None),
    current_user=Depends(get_current_user)
):
    """Создание новой задачи с возможностью назначения нескольким пользователям"""
    # Проверяем права на создание задачи (только owner и admin)
    await check_project_permissions(
        project_id, 
        str(current_user.id), 
        required_roles=["owner", "admin"]
    )
    
    db = get_database()
    
    # Если указаны assignees, проверяем что они являются участниками проекта
    if assignees:
        project = await db["projects"].find_one({"_id": ObjectId(project_id)})
        for assignee in assignees:
            if assignee not in project.get("members", []):
                raise HTTPException(
                    status_code=400, 
                    detail=f"User {assignee} is not a member of the project"
                )
    
    # Создаем задачи для каждого assignee или одну задачу, если assignees не указаны
    tasks = []
    if assignees:
        for assignee in assignees:
            task_dict = task.model_dump()
            task_dict.update({
                "project_id": project_id,
                "reporter_id": str(current_user.id),
                "assignee_id": assignee,
                "created_at": datetime.utcnow()
            })
            result = await db["tasks"].insert_one(task_dict)
            task_dict["id"] = str(result.inserted_id)
            tasks.append(Task(**task_dict))
    else:
        task_dict = task.model_dump()
        task_dict.update({
            "project_id": project_id,
            "reporter_id": str(current_user.id),
            "created_at": datetime.utcnow()
        })
        result = await db["tasks"].insert_one(task_dict)
        task_dict["id"] = str(result.inserted_id)
        tasks.append(Task(**task_dict))
    
    return tasks[0] if len(tasks) == 1 else tasks


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
    db = get_database()
    
    # Получаем задачу
    task = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Проверяем права на изменение статуса
    await check_project_permissions(task["project_id"], str(current_user.id))
    
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


@router.get("/user/tasks", response_model=List[Task])
async def get_user_tasks(current_user=Depends(get_current_user)):
    """Получение всех задач пользователя из всех проектов"""
    db = get_database()
    
    # Находим все проекты пользователя
    projects = await db["projects"].find(
        {"members": str(current_user.id)}
    ).to_list(None)
    project_ids = [str(project["_id"]) for project in projects]
    
    # Получаем все задачи пользователя
    tasks = await db["tasks"].find({
        "$or": [
            {"project_id": {"$in": project_ids}},
            {"assignee_id": str(current_user.id)}
        ]
    }).to_list(None)
    
    # Преобразуем _id в id
    for task in tasks:
        task["id"] = str(task["_id"])
        del task["_id"]
    
    return [Task(**task) for task in tasks]


@router.post("/{project_id}/tasks/bulk", response_model=List[Task])
async def create_tasks_for_members(
    project_id: str,
    task: Task,
    assign_to_all: bool = Query(False),
    member_ids: Optional[List[str]] = Query(None),
    current_user=Depends(get_current_user)
):
    """Создание задачи для выбранных участников или всех участников проекта"""
    db = get_database()
    
    # Проверяем права на создание задачи (только owner и admin)
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Проверяем роль пользователя
    team = None
    await check_project_permissions(project_id, user_id, required_roles=["owner", "admin"])
    if team:
        user_role = next(
            (member["role"] for member in team["members"] 
             if member["user_id"] == str(current_user.id)),
            None
        )
        if user_role not in ["owner", "admin"]:
            raise HTTPException(
                status_code=403,
                detail="Only owner and admin can create tasks"
            )
    
    # Определяем список участников для назначения задачи
    assignees = []
    if assign_to_all:
        assignees = project.get("members", [])
    elif member_ids:
        # Проверяем, что все указанные пользователи являются участниками проекта
        for member_id in member_ids:
            if member_id not in project.get("members", []):
                raise HTTPException(
                    status_code=400,
                    detail=f"User {member_id} is not a member of the project"
                )
        assignees = member_ids
    
    # Создаем задачи для каждого участника
    created_tasks = []
    for assignee in assignees:
        task_dict = task.model_dump()
        task_dict.update({
            "project_id": project_id,
            "reporter_id": str(current_user.id),
            "assignee_id": assignee,
            "created_at": datetime.utcnow()
        })
        result = await db["tasks"].insert_one(task_dict)
        task_dict["id"] = str(result.inserted_id)
        created_tasks.append(Task(**task_dict))
    
    return created_tasks


@router.get("/project/{project_id}/tasks", response_model=List[Task])
async def get_project_tasks(
    project_id: str,
    skip: int = Query(0),
    limit: int = Query(50),
    current_user=Depends(get_current_user)
):
    tasks = await db.client.tasks.find(
        {"project_id": project_id}
    ).skip(skip).limit(limit).to_list(None)
    return [Task(**task) for task in tasks]


@router.put("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    task_update: Task,
    current_user=Depends(get_current_user)
):
    """Обновление задачи с проверкой прав доступа"""
    db = get_database()
    
    # Получаем текущую задачу
    task = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Получаем проект
    project = await db["projects"].find_one({"_id": ObjectId(task["project_id"])})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Проверяем права пользователя
    is_admin = False
    await check_project_permissions(project_id, user_id, required_roles=["owner", "admin"])
    if team:
        user_role = next(
            (member["role"] for member in team["members"] 
             if member["user_id"] == str(current_user.id)),
            None
        )
        is_admin = user_role in ["owner", "admin"]
    else:
        is_admin = project.get("owner_id") == str(current_user.id)
    
    # Если пользователь не админ, он может менять только статус своих задач
    if not is_admin:
        if task.get("assignee_id") != str(current_user.id):
            raise HTTPException(
                status_code=403,
                detail="You can only update tasks assigned to you"
            )
        # Разрешаем менять только статус
        allowed_fields = {"status"}
        update_fields = set(task_update.model_dump(exclude_unset=True).keys())
        if not update_fields.issubset(allowed_fields):
            raise HTTPException(
                status_code=403,
                detail="You can only update task status"
            )
    
    # Обновляем задачу
    update_dict = task_update.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db["tasks"].update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_dict}
    )
    
    updated_task = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    updated_task["id"] = str(updated_task["_id"])
    del updated_task["_id"]
    
    return Task(**updated_task)


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


async def check_project_permissions(project_id: str, user_id: str, required_roles=None):
    """Проверка прав пользователя в проекте и команде"""
    db = get_database()
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Проверяем права в команде, если проект привязан к команде
    await check_project_permissions(project_id, user_id, required_roles=["owner", "admin"])
    if team:
        for member in team["members"]:
            if member["user_id"] == user_id:
                if required_roles and member["role"] in required_roles:
                    return True
                elif not required_roles:
                    return True
    
    # Если проект не привязан к команде, проверяем, является ли пользователь владельцем
    if project.get("owner_id") == user_id:
        return True
        
    # Проверяем, является ли пользователь участником проекта
    if user_id in project.get("members", []):
        return True
        
    raise HTTPException(status_code=403, detail="You don't have permission for this action")
