from fastapi import APIRouter, HTTPException
from app.database import database
from app.models import Task
from bson import ObjectId

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/")
async def create_task(task: Task):
    task_dict = task.dict()
    task_dict["created_at"] = task.created_at.isoformat()

    new_task = await database["tasks"].insert_one(task_dict)
    return {"id": str(new_task.inserted_id)}

@router.get("/{task_id}")
async def get_task(task_id: str):
    task = await database["tasks"].find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
