from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from ..models.user import UserCreate, User
from ..utils.auth import create_access_token, get_current_user
from ..utils.security import get_password_hash, verify_password
from ..database import get_database
from ..config import settings
from datetime import datetime
from typing import List



router = APIRouter()


@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate):
    db = get_database()

    # Checking if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Create new user
    user_dict = user_data.dict()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    
    user_dict["created_at"] = datetime.utcnow()
    user_dict["is_active"] = True

    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)

    return User(**user_dict)



@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    user = await db.users.find_one({"email": form_data.username})

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await create_access_token(
        data={"sub": str(user["_id"])},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=List[User])
async def get_all_users(current_user=Depends(get_current_user)):
    """
    Возвращает список всех пользователей.
    При необходимости добавьте проверку прав (например, только админ может видеть всех).
    """
    db = get_database()
    users_cursor = db["users"].find({})
    users_list = await users_cursor.to_list(None)
    result = []
    for user in users_list:
        user["id"] = str(user["_id"])
        del user["_id"]
        result.append(User(**user))
    return result