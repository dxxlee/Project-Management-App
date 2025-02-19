from bson.decimal128 import Decimal128
from bson import Binary
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import OperationFailure
from .database import get_database

async def init_schema_validation():
    db = get_database()

    # -----------------------------------------------
    # Коллекция "projects" с валидацией и продвинутыми BSON типами
    # -----------------------------------------------
    project_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "owner_id", "created_at"],
            "properties": {
                "name": {
                    "bsonType": "string",
                    "description": "Project name must be a string and is required."
                },
                "description": {
                    "bsonType": ["string", "null"],
                    "description": "Optional project description."
                },
                "team_id": {
                    "bsonType": ["string", "null"],
                    "description": "Team ID, if the project is associated with a team."
                },
                "owner_id": {
                    "bsonType": "string",
                    "description": "Owner ID must be a string."
                },
                "members": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "string"
                    },
                    "description": "Array of member IDs."
                },
                "created_at": {
                    "bsonType": "date",
                    "description": "Creation date must be a valid date."
                },
                "updated_at": {
                    "bsonType": ["date", "null"],
                    "description": "Update date, if provided."
                },
                "team_name": {
                    "bsonType": ["string", "null"],
                    "description": "Optional team name."
                },
                "budget": {
                    "bsonType": ["decimal", "null"],
                    "description": "Optional budget stored as a decimal (Decimal128 in MongoDB)."
                },
                "attachments": {
                    "bsonType": ["binData", "null"],
                    "description": "Optional binary data for attachments."
                }
            }
        }
    }

    try:
        await db.command({
            "collMod": "projects",
            "validator": project_schema,
            "validationLevel": "moderate"
        })
    except OperationFailure as e:
        # Если коллекция не существует, создаём её с валидатором
        try:
            await db.create_collection("projects", validator=project_schema)
        except Exception as create_exc:
            print("Error creating 'projects' collection:", create_exc)

    # -----------------------------------------------
    # Коллекция "tasks"
    # -----------------------------------------------
    task_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["title", "priority", "status", "project_id", "created_at"],
            "properties": {
                "title": {
                    "bsonType": "string",
                    "description": "Task title is required."
                },
                "description": {
                    "bsonType": ["string", "null"],
                    "description": "Optional description."
                },
                "project_id": {
                    "bsonType": "string",
                    "description": "Project ID must be a string."
                },
                "assignee_id": {
                    "bsonType": ["string", "null"],
                    "description": "Assignee ID, if provided."
                },
                "reporter_id": {
                    "bsonType": ["string", "null"],
                    "description": "Reporter ID, if provided."
                },
                "status": {
                    "bsonType": "string",
                    "enum": ["todo", "in_progress", "review", "done"],
                    "description": "Status must be one of: todo, in_progress, review, done."
                },
                "priority": {
                    "bsonType": "string",
                    "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                    "description": "Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL."
                },
                "due_date": {
                    "bsonType": ["date", "null"],
                    "description": "Due date, if provided, must be a date."
                },
                "created_at": {
                    "bsonType": "date",
                    "description": "Creation date is required."
                },
                "updated_at": {
                    "bsonType": ["date", "null"],
                    "description": "Update date, if provided."
                },
                "labels": {
                    "bsonType": "array",
                    "items": { "bsonType": "string" },
                    "description": "Array of labels."
                },
                "comments": {
                    "bsonType": "array",
                    "items": {},
                    "description": "Array of comment objects."
                },
                "attachment": {
                    "bsonType": ["binData", "null"],
                    "description": "Optional binary attachment."
                },
                "metadata": {
                    "bsonType": ["object", "null"],
                    "description": "Optional metadata as an object."
                }
            }
        }
    }

    try:
        await db.command({
            "collMod": "tasks",
            "validator": task_schema,
            "validationLevel": "moderate"
        })
    except OperationFailure as e:
        try:
            await db.create_collection("tasks", validator=task_schema)
        except Exception as create_exc:
            print("Error creating 'tasks' collection:", create_exc)

    # -----------------------------------------------
    # Коллекция "teams"
    # -----------------------------------------------
    team_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "members", "created_at"],
            "properties": {
                "name": {
                    "bsonType": "string",
                    "description": "Team name is required."
                },
                "description": {
                    "bsonType": ["string", "null"],
                    "description": "Optional description."
                },
                "members": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["user_id", "role"],
                        "properties": {
                            "user_id": { "bsonType": "string" },
                            "role": {
                                "bsonType": "string",
                                "enum": ["owner", "admin", "member"]
                            },
                            "user_name": { "bsonType": ["string", "null"] }
                        }
                    },
                    "description": "Array of team member objects."
                },
                "created_at": {
                    "bsonType": "date",
                    "description": "Creation date is required."
                },
                "updated_at": {
                    "bsonType": ["date", "null"],
                    "description": "Update date, if provided."
                }
            }
        }
    }

    try:
        await db.command({
            "collMod": "teams",
            "validator": team_schema,
            "validationLevel": "moderate"
        })
    except OperationFailure as e:
        try:
            await db.create_collection("teams", validator=team_schema)
        except Exception as create_exc:
            print("Error creating 'teams' collection:", create_exc)

    # -----------------------------------------------
    # Коллекция "users"
    # -----------------------------------------------
    user_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["email", "username", "created_at", "is_active"],
            "properties": {
                "email": {
                    "bsonType": "string",
                    "pattern": r"^\S+@\S+\.\S+$",
                    "description": "Must be a valid email."
                },
                "username": {
                    "bsonType": "string",
                    "description": "Username is required."
                },
                "full_name": {
                    "bsonType": ["string", "null"],
                    "description": "Optional full name."
                },
                "created_at": {
                    "bsonType": "date",
                    "description": "Creation date is required."
                },
                "is_active": {
                    "bsonType": "bool",
                    "description": "is_active must be a boolean."
                }
            }
        }
    }

    try:
        await db.command({
            "collMod": "users",
            "validator": user_schema,
            "validationLevel": "moderate"
        })
    except OperationFailure as e:
        try:
            await db.create_collection("users", validator=user_schema)
        except Exception as create_exc:
            print("Error creating 'users' collection:", create_exc)

    print("Schema validation rules have been applied to all collections.")
