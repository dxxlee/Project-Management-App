from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Загружаем переменные из .env
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "jira_clone"

# Подключение к MongoDB
client = AsyncIOMotorClient(MONGO_URL)
database = client[DB_NAME]
