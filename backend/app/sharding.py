import logging
from app.database import db  
from app.config import settings
from pymongo.errors import OperationFailure

logger = logging.getLogger(__name__)

async def configure_sharding():
    """
    Настраивает шардирование для базы данных и коллекции tasks.
    Используется ключ shard key "project_id".
    """
    client = db.client
    admin_db = client.admin
    db_name = settings.DATABASE_NAME

    try:
        result = await admin_db.command("enableSharding", db_name)
        logger.info("Sharding enabled for database '%s': %s", db_name, result)
    except OperationFailure as e:
        logger.warning("Sharding might already be enabled for database '%s': %s", db_name, e)

    try:
        result = await admin_db.command(
            "shardCollection", f"{db_name}.tasks",
            key={"project_id": 1}
        )
        logger.info("Sharding configured for collection 'tasks' with shard key 'project_id': %s", result)
    except OperationFailure as e:
        logger.warning("Error configuring sharding for 'tasks': %s", e)

    

    logger.info("Sharding configuration completed.")
