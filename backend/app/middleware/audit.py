from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from ..utils.audit import log_action
import json


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Saving information about request
        request.state.ip_address = request.client.host
        request.state.user_agent = request.headers.get("user-agent")

        response = await call_next(request)
        return response