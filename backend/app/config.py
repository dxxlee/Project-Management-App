from pydantic import BaseModel
from dotenv import load_dotenv
import os
from cryptography.fernet import Fernet
import secrets

load_dotenv()


class Settings(BaseModel):
    # Database settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb+srv://danielcoollee06:uOuu5b8aRUwdHNA0@clusternosqlfinal.q17yv.mongodb.net/NoSqlDatabase?retryWrites=true&w=majority")
    DATABASE_NAME: str = "NoSqlDatabase"

    # Connection pools
    MAX_CONNECTIONS_COUNT: int = 10
    MIN_CONNECTIONS_COUNT: int = 2

    # Security settings
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
    SECURE_HEADERS: bool = True
    AUDIT_ENABLED: bool = True

    # JWT settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7


settings = Settings()