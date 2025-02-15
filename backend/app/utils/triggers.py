from ..database import db
from ..config import settings
import asyncio

async def setup_triggers():
    # Триггер для уведомлений при изменении задачи
    trigger_config = {
        'name': 'task-update-notification',
        'type': 'DATABASE',
        'function_name': 'taskUpdateNotification',
        'config': {
            'operation_types': ['UPDATE'],
            'database': settings.DATABASE_NAME,
            'collection': 'tasks'
        }
    }