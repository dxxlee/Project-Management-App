from enum import Enum
from typing import Optional
from fastapi import HTTPException, Depends
from ..utils.auth import get_current_user
from ..database import db


class Permission(str, Enum):
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"


class Role(str, Enum):
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    DEVELOPER = "developer"
    VIEWER = "viewer"


ROLE_PERMISSIONS = {
    Role.ADMIN: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
    Role.PROJECT_MANAGER: [Permission.READ, Permission.WRITE, Permission.DELETE],
    Role.DEVELOPER: [Permission.READ, Permission.WRITE],
    Role.VIEWER: [Permission.READ]
}


async def check_permission(user_id: str, project_id: str, required_permission: Permission):
    """Check user's permissions for a project"""
    # Get user's role in the project
    user_role = await db.client.project_roles.find_one({
        "project_id": project_id,
        "user_id": user_id
    })

    if not user_role:
        raise HTTPException(status_code=403, detail="Access denied")

    role = Role(user_role["role"])
    permissions = ROLE_PERMISSIONS[role]

    if required_permission not in permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")


def require_permission(permission: Permission):
    """Decorator for checking permissions"""

    async def dependency(
            current_user=Depends(get_current_user),
            project_id: Optional[str] = None
    ):
        if project_id:
            await check_permission(current_user.id, project_id, permission)
        return current_user

    return dependency