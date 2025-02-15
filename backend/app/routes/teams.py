from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..models.team import Team
from ..utils.auth import get_current_user
from ..database import db
from bson import ObjectId

router = APIRouter()


@router.post("/", response_model=Team)
async def create_team(team: Team, current_user=Depends(get_current_user)):
    """Создание новой команды"""
    team_dict = team.model_dump()  # Используем model_dump() вместо dict()
    team_dict["members"] = [current_user.id]

    # Проверяем существование пользователя
    user = await db.client.users.find_one({"_id": current_user.id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.client.teams.insert_one(team_dict)
    team_dict["id"] = str(result.inserted_id)
    return Team(**team_dict)


@router.post("/{team_id}/members/{user_id}")
async def add_team_member(
        team_id: str,
        user_id: str,
        current_user=Depends(get_current_user)
):
    """Добавление участника в команду"""
    # Проверяем, является ли current_user членом команды
    team = await db.client.teams.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if current_user.id not in team["members"]:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to modify this team"
        )

    # Проверяем существование пользователя
    user = await db.client.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.client.teams.update_one(
        {"_id": ObjectId(team_id)},
        {"$addToSet": {"members": user_id}}
    )

    return {"status": "success", "message": "Member added successfully"}


@router.delete("/{team_id}/members/{user_id}")
async def remove_team_member(
        team_id: str,
        user_id: str,
        current_user=Depends(get_current_user)
):
    """Удаление участника из команды"""
    # Проверяем, является ли current_user членом команды
    team = await db.client.teams.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if current_user.id not in team["members"]:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to modify this team"
        )

    result = await db.client.teams.update_one(
        {"_id": ObjectId(team_id)},
        {"$pull": {"members": user_id}}
    )

    return {"status": "success", "message": "Member removed successfully"}


@router.get("/{team_id}", response_model=Team)
async def get_team(team_id: str, current_user=Depends(get_current_user)):
    """Получение информации о команде"""
    team = await db.client.teams.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    return Team(**team)


@router.get("/", response_model=List[Team])
async def get_user_teams(current_user=Depends(get_current_user)):
    """Получение списка команд пользователя"""
    teams = await db.client.teams.find(
        {"members": current_user.id}
    ).to_list(None)

    return [Team(**team) for team in teams]