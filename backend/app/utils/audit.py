from datetime import datetime, timezone
from typing import Optional
from ..database import db


async def log_action(
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        details: Optional[dict] = None
):
    """Логирование действий пользователя"""
    audit_entry = {
        "user_id": user_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc),
        "ip_address": None,  # Можно добавить через middleware
        "user_agent": None  # Можно добавить через middleware
    }

    await db.client.audit_logs.insert_one(audit_entry)