from ..database import db
from ..config import settings
import asyncio

async def setup_triggers():
    """Настройка триггеров базы данных"""
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
    
    try:
        await db.command({
            'createTrigger': trigger_config['name'],
            'source': 'DATABASE',
            'target': {
                'type': 'FUNCTION',
                'name': trigger_config['function_name']
            },
            'operation_types': trigger_config['config']['operation_types'],
            'database': trigger_config['config']['database'],
            'collection': trigger_config['config']['collection']
        })
        
        print(f"Trigger {trigger_config['name']} created successfully")
        
    except Exception as e:
        print(f"Error creating trigger: {str(e)}")
        raise