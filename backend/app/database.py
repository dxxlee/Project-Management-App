from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import monitoring
from .config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CommandLogger(monitoring.CommandListener):
    def started(self, event):
        logger.debug(f"Command {event.command_name} started on server {event.connection_id}")

    def succeeded(self, event):
        logger.debug(f"Command {event.command_name} succeeded in {event.duration_micros} microseconds")

    def failed(self, event):
        logger.error(f"Command {event.command_name} failed in {event.duration_micros} microseconds")

class Database:
    client: AsyncIOMotorClient = None

    async def connect(self):
        # Регистрируем слушатель команд (логирование)
        monitoring.register(CommandLogger())

        self.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=settings.MAX_CONNECTIONS_COUNT,
            minPoolSize=settings.MIN_CONNECTIONS_COUNT,
        )
        try:
            # Проверяем соединение
            await self.client.admin.command("ping")
            logger.info("Successfully connected to MongoDB!")
        except Exception as e:
            logger.error(f"Could not connect to MongoDB: {e}")
            raise

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

# Создаём экземпляр класса Database
db = Database()

def get_database():
    """
    Возвращает объект типа AsyncIOMotorDatabase, с которым можно работать как с db["collection"].
    """
    if db.client is None:
        raise RuntimeError("Database connection has not been initialized. Call db.connect() first.")
    return db.client[settings.DATABASE_NAME]
