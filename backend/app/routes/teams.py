from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from ..models.project import ProjectCreate, Project
from ..models.team import Team, TeamRole, TeamUpdate, AddMemberByEmail
from ..utils.auth import get_current_user
from ..database import db, get_database
from bson import ObjectId

router = APIRouter()


@router.post("/", response_model=Team)
async def create_team(team: Team, current_user=Depends(get_current_user)):
    """Создание новой команды"""
    db = get_database()
    team_dict = team.model_dump()
    team_dict["members"] = [{"user_id": str(current_user.id), "role": TeamRole.OWNER}]
    result = await db["teams"].insert_one(team_dict)
    team_dict["id"] = str(result.inserted_id)
    return Team(**team_dict)

@router.put("/{team_id}", response_model=Team)
async def update_team(team_id: str, team_update: TeamUpdate, current_user=Depends(get_current_user)):
    """Обновление команды"""
    db = get_database()
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if str(current_user.id) != team["members"][0]["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to modify this team"
        )
    update_dict = team_update.model_dump(exclude_unset=True)
    result = await db["teams"].update_one(
        {"_id": ObjectId(team_id)},
        {"$set": update_dict}
    )
    updated_team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    updated_team["id"] = str(updated_team["_id"])
    del updated_team["_id"]
    return Team(**updated_team)

@router.delete("/{team_id}")
async def delete_team(team_id: str, current_user=Depends(get_current_user)):
    """Удаление команды"""
    db = get_database()
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if str(current_user.id) != team["members"][0]["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to delete this team"
        )
    result = await db["teams"].delete_one({"_id": ObjectId(team_id)})
    if result.deleted_count == 1:
        return {"status": "success", "message": "Team deleted successfully"}
    raise HTTPException(status_code=500, detail="Failed to delete team")

@router.post("/{team_id}/members")
async def add_team_member_by_email(
    team_id: str,
    data: AddMemberByEmail,  # Используем модель для валидации
    current_user=Depends(get_current_user)
):
    """Добавление участника в команду по электронной почте"""
    db = get_database()
    email = data.email  # Получаем email из валидированных данных

    # Проверяем существование команды
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Проверяем права текущего пользователя
    if str(current_user.id) != team["members"][0]["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to modify this team"
        )

    # Ищем пользователя по email
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")

    user_id = str(user["_id"])

    # Проверяем, что пользователь еще не является участником команды
    if any(member["user_id"] == user_id for member in team["members"]):
        raise HTTPException(status_code=400, detail="User is already a member of this team")

    # Добавляем пользователя в команду
    result = await db["teams"].update_one(
        {"_id": ObjectId(team_id)},
        {"$addToSet": {"members": {"user_id": user_id, "role": TeamRole.MEMBER}}}
    )

    return {"status": "success", "message": "Member added successfully"}


@router.delete("/{team_id}/members/{user_id}")
async def remove_team_member(
    team_id: str,
    user_id: str,
    current_user=Depends(get_current_user)
):
    """Удаление участника из команды"""
    db = get_database()

    # Проверяем существование команды
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Проверяем права текущего пользователя
    if str(current_user.id) != team["members"][0]["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to modify this team"
        )

    # Проверяем, является ли удаляемый участник владельцем
    if any(member["user_id"] == user_id and member["role"] == "owner" for member in team["members"]):
        raise HTTPException(
            status_code=400,
            detail="The owner cannot remove themselves from the team"
        )

    # Удаляем участника из команды
    result = await db["teams"].update_one(
        {"_id": ObjectId(team_id)},
        {"$pull": {"members": {"user_id": user_id}}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="User is not a member of this team")

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
    db = get_database()
    print("Fetching teams for user:", current_user.id)
    # Ищем команды, где пользователь является участником
    teams_cursor = db["teams"].find({"members": {"$elemMatch": {"user_id": str(current_user.id)}}})
    teams = await teams_cursor.to_list(None)
    print("Raw Teams Data:", teams)

    # Преобразуем ObjectId в строку и добавляем поле id
    transformed_teams = []
    for team in teams:
        team["id"] = str(team["_id"])
        del team["_id"]

        # Enrich team members with user information
        for member in team["members"]:
            user_id = member["user_id"]
            user = await db["users"].find_one({"_id": ObjectId(user_id)})
            if user:
                member["user_name"] = user["username"]  # Добавляем имя пользователя
            else:
                member["user_name"] = "Unknown User"

        transformed_teams.append(Team(**team))
    return transformed_teams

# Новый эндпоинт для создания проекта в рамках команды
@router.post("/{team_id}/projects", response_model=Project)
async def create_team_project(team_id: str, project: ProjectCreate, current_user = Depends(get_current_user)):
    db = get_database()
    # Проверяем, что команда существует
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Проверяем, что текущий пользователь имеет право создавать проекты в этой команде
    allowed_roles = [TeamRole.OWNER, TeamRole.ADMIN]
    user_roles = [member["role"] for member in team["members"] if member["user_id"] == str(current_user.id)]
    if not any(role in allowed_roles for role in user_roles):
        raise HTTPException(status_code=403, detail="You don't have permission to create a project for this team")

    # Получаем список всех user_id из team["members"]
    team_member_ids = [member["user_id"] for member in team["members"]]

    # Формируем данные проекта, привязываем его к команде
    project_dict = project.model_dump()
    project_dict.update({
        "owner_id": str(current_user.id),
        "members": team_member_ids,  # Добавляем всех участников команды в проект
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "team_id": team_id  # Связь с командой
    })

    result = await db["projects"].insert_one(project_dict)
    created_project = await db["projects"].find_one({"_id": result.inserted_id})
    if created_project:
        created_project["id"] = str(created_project["_id"])
        del created_project["_id"]
        return Project(**created_project)

    raise HTTPException(status_code=500, detail="Failed to create project")



# Новый эндпоинт для получения списка проектов, связанных с командой
@router.get("/{team_id}/projects", response_model=List[Project])
async def get_team_projects(team_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    # Проверяем, что команда существует
    team = await db["teams"].find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Проверяем, что пользователь является участником команды (не обязательно Owner или Admin на этом этапе)
    if not any(member["user_id"] == str(current_user.id) for member in team["members"]):
        raise HTTPException(status_code=403, detail="You are not a member of this team")

    projects_cursor = db["projects"].find({"team_id": team_id})
    projects = await projects_cursor.to_list(length=None)
    transformed_projects = []
    for project in projects:
        project["id"] = str(project["_id"])
        del project["_id"]
        transformed_projects.append(Project(**project))
    return transformed_projects