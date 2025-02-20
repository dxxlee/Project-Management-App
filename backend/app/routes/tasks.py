from fastapi import APIRouter, Depends, HTTPException, Query, FastAPI, Body
from typing import List, Optional, Any
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, ValidationError


from ..models.task import Task, TaskStatus, TaskPriority
from ..utils.auth import get_current_user
from ..database import get_database
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from pydantic import ValidationError
from fastapi import Query
from datetime import datetime, timezone



router = APIRouter()

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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

    team_id = project.get("team_id")
    if team_id:
        team = await db["teams"].find_one({"_id": ObjectId(team_id)})
        if team:
            for member in team["members"]:
                if member["user_id"] == user_id:
                    if required_roles:
                        if member["role"] in required_roles:
                            return True
                        else:
                            raise HTTPException(status_code=403, detail="You don't have permission for this action")
                    else:
                        return True

    if project.get("owner_id") == user_id:
        return True
    if user_id in project.get("members", []):
        return True

    raise HTTPException(status_code=403, detail="You don't have permission for this action")

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
        await check_project_permissions(project_id, str(current_user.id))

        if not task.title:
            raise HTTPException(status_code=422, detail="Task title is required")

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
    await check_project_permissions(project_id, str(current_user.id))

    tasks_cursor = db["tasks"].find({"project_id": project_id}).skip(skip).limit(limit)
    tasks_list = await tasks_cursor.to_list(None)

    for t in tasks_list:
        t["id"] = str(t["_id"])
        del t["_id"]

    return [Task(**t) for t in tasks_list]

@router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user=Depends(get_current_user)):
    """
    Получение информации о задаче по её ID.
    """
    db = get_database()
    task_data = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")

    await check_project_permissions(task_data["project_id"], str(current_user.id))

    task_data["id"] = str(task_data["_id"])
    del task_data["_id"]
    return Task(**task_data)


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

    existing_task = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")

    project_id = existing_task["project_id"]
    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

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
        if project.get("owner_id") == user_id:
            is_admin = True

    update_data = task_update.dict(exclude_unset=True)
    print("Received update data:", update_data)

    if not is_admin:
        if existing_task.get("assignee_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only update tasks assigned to you"
            )
        allowed_fields = {"status"}
        if not set(update_data.keys()).issubset(allowed_fields):
            raise HTTPException(
                status_code=403,
                detail="You can only update task status"
            )

    update_data["updated_at"] = datetime.utcnow()

    await db["tasks"].update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )

    updated = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    updated["id"] = str(updated["_id"])
    del updated["_id"]

    return Task(**updated)

class CommentDeleteRequest(BaseModel):
    comment_text: str

@router.put("/tasks/{task_id}/comments/remove", response_model=Task)
async def remove_comment_from_task(
    task_id: str,
    payload: CommentDeleteRequest,
    current_user=Depends(get_current_user)
):
    """
    Удаляет комментарий из массива comments задачи по значению поля "text".
    Использует оператор $pull.
    """
    comment_text = payload.comment_text
    db = get_database()
    result = await db["tasks"].update_one(
        {"_id": ObjectId(task_id)},
        {"$pull": {"comments": {"text": comment_text}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found or comment not removed")
    updated_task = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    updated_task["id"] = str(updated_task["_id"])
    del updated_task["_id"]
    return Task(**updated_task)
    
@router.put("/tasks/{task_id}/status")
async def update_task_status(
    task_id: str,
    status: TaskStatus = Query(...),
    current_user=Depends(get_current_user)
):
    """
    Обновление статуса задачи (todo, in_progress, review, done).
    """
    
    db = get_database()
    task_data = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")

    await check_project_permissions(task_data["project_id"], str(current_user.id))

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
    """
    Получение всех задач пользователя (где он участник проекта или assignee).
    """
    db = get_database()
    user_id = str(current_user.id)

    projects_cursor = db["projects"].find({"members": user_id})
    projects_list = await projects_cursor.to_list(None)
    project_ids = [str(p["_id"]) for p in projects_list]

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

    await check_project_permissions(project_id, user_id, required_roles=["owner", "admin"])

    project = await db["projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if assign_to_all:
        assignees = project.get("members", [])
    elif member_ids:
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

    task_data = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")

    project_id = task_data["project_id"]
    await check_project_permissions(project_id, user_id, required_roles=["owner", "admin"])

    user_to_assign = await db["users"].find_one({"_id": ObjectId(assignee_id)})
    if not user_to_assign:
        raise HTTPException(status_code=404, detail="User not found")

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


@router.put("/tasks/{task_id}/comments", response_model=Task)
async def add_comment_to_task(
    task_id: str,
    comment: dict,
    current_user=Depends(get_current_user)
):
    """
    Добавляет комментарий в массив comments задачи с id=task_id.
    Использует оператор $push.
    """
    db = get_database()
    comment["created_at"] = datetime.utcnow()
    result = await db["tasks"].update_one(
        {"_id": ObjectId(task_id)},
        {"$push": {"comments": comment}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found or comment not added")
    updated_task = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    updated_task["id"] = str(updated_task["_id"])
    del updated_task["_id"]
    return Task(**updated_task)

@router.put("/tasks/{task_id}/comments/remove", response_model=Task)
async def remove_comment_from_task(
    task_id: str,
    comment_text: str = Body(...),
    current_user=Depends(get_current_user)
):
    """
    Удаляет комментарий из массива comments задачи по значению поля "text".
    Использует оператор $pull.
    """
    db = get_database()
    result = await db["tasks"].update_one(
        {"_id": ObjectId(task_id)},
        {"$pull": {"comments": {"text": comment_text}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found or comment not removed")
    updated_task = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    updated_task["id"] = str(updated_task["_id"])
    del updated_task["_id"]
    return Task(**updated_task)

def convert_objectids(obj):
    """
    Рекурсивно обходит структуру (dict, list) 
    и преобразует все ObjectId -> str(ObjectId).
    """
    if isinstance(obj, list):
        return [convert_objectids(v) for v in obj]
    if isinstance(obj, dict):
        return {k: convert_objectids(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.get("/aggregation/full_summary", response_model=Any)
async def full_aggregation_summary(
    project_id: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    """
    Пример многоступенчатого пайплайна:
      1. $match (если передан project_id)
      2. $facet (summaryByStatus и bucketByDueDate)
      3. $merge (в коллекцию 'full_summary')
    Возвращаем последний документ из full_summary, 
    предварительно конвертируя все ObjectId в строки.
    """
    db = get_database()

    pipeline = []
    if project_id:
        pipeline.append({"$match": {"project_id": project_id}})

    pipeline.append({
        "$facet": {
            "summaryByStatus": [
                {"$unwind": {"path": "$labels", "preserveNullAndEmptyArrays": True}},
                {"$group": {
                    "_id": {"status": "$status", "label": "$labels"},
                    "count": {"$sum": 1}
                }},
                {"$project": {
                    "_id": 0,
                    "status": "$_id.status",
                    "label": "$_id.label",
                    "count": 1
                }},
                {"$group": {
                    "_id": "$status",
                    "total": {"$sum": "$count"},
                    "labels": {"$push": {"label": "$label", "count": "$count"}}
                }},
                {"$sort": {"_id": 1}}
            ],
            "bucketByDueDate": [
                {
                    "$bucket": {
                        "groupBy": "$due_date",
                        "boundaries": [
                            datetime(2023, 1, 1, tzinfo=timezone.utc),
                            datetime(2023, 6, 1, tzinfo=timezone.utc),
                            datetime(2024, 1, 1, tzinfo=timezone.utc),
                            datetime(2025, 1, 1, tzinfo=timezone.utc)
                        ],
                        "default": "Other",
                        "output": {
                            "count": {"$sum": 1},
                            "tasks": {"$push": "$title"}
                        }
                    }
                }
            ]
        }
    })

    pipeline.append({
        "$merge": {
            "into": "full_summary",
            "whenMatched": "replace",
            "whenNotMatched": "insert"
        }
    })

    try:
        await db["tasks"].aggregate(pipeline).to_list(length=None)

        docs = await db["full_summary"].find({}).sort("_id", -1).limit(1).to_list(None)
        if not docs:
            return {}

        doc_converted = convert_objectids(docs[0])
        return doc_converted

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))