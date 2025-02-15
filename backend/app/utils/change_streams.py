from fastapi import WebSocket
import asyncio
import json
from bson import json_util

class ChangeStreamManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: str):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)

    def disconnect(self, websocket: WebSocket, project_id: str):
        if project_id in self.active_connections:
            self.active_connections[project_id].remove(websocket)

    async def broadcast(self, project_id: str, message: dict):
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                await connection.send_text(json.dumps(message, default=json_util.default))

manager = ChangeStreamManager()

# app/routes/websockets.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from ..utils.auth import get_current_user
from ..utils.change_streams import manager
from ..database import db

router = APIRouter()

@router.websocket("/ws/project/{project_id}")
async def project_websocket(websocket: WebSocket, project_id: str):
    await manager.connect(websocket, project_id)
    try:
        # Настраиваем Change Stream для коллекции tasks
        pipeline = [{'$match': {'fullDocument.project_id': project_id}}]
        async with db.client[settings.DATABASE_NAME].tasks.watch(pipeline) as change_stream:
            async for change in change_stream:
                await manager.broadcast(project_id, {
                    'type': change['operationType'],
                    'document': change['fullDocument']
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)