import logging
from fastapi import FastAPI
from app.database import get_database, db
from pymongo.errors import OperationFailure

logger = logging.getLogger(__name__)

async def create_indexes():
    db_inst = get_database()
    
    await db_inst["tasks"].create_index(
        [("project_id", 1), ("status", 1)],
        name="project_status_idx"
    )
    logger.info(" Created compound index 'project_status_idx' on tasks.")

    await db_inst["tasks"].create_index(
        [("labels", 1)],
        name="labels_idx"
    )
    logger.info(" Created multi-key index 'labels_idx' on tasks.")

    try:
        await db_inst["tasks"].create_index(
            [("expireAt", 1)],
            expireAfterSeconds=0,
            name="expire_idx"
        )
        logger.info(" Created TTL index 'expire_idx' on tasks.")
    except Exception as e:
        logger.error("Error creating TTL index on tasks: %s", e)

    await db_inst["tasks"].create_index(
        [("title", "text"), ("description", "text")],
        name="text_idx"
    )
    logger.info(" Created text index 'text_idx' on tasks.")


    await db_inst["projects"].create_index(
        [("members", 1)],
        name="members_idx"
    )
    await db_inst["projects"].create_index(
        [("team_id", 1)],
        name="team_id_idx"
    )
    logger.info(" Created indexes on projects.")


    await db_inst["teams"].create_index(
        [("members.user_id", 1)],
        name="team_members_idx"
    )
    logger.info(" Created index 'team_members_idx' on teams.")


    query = {"project_id": "67b43eefb8867e2f2b7998fe"}  
    explanation = await db_inst.command({
    "explain": {
        "find": "tasks",
        "filter": query
    },
    "verbosity": "executionStats"
    })
    logger.info("Explain for tasks query: %s", explanation)


    logger.info("  Indexes created successfully!")
