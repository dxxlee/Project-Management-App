from fastapi import FastAPI
from app.middleware.audit import AuditMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.database import db
from app.routes import auth, projects, tasks, teams

app = FastAPI(title="Project Management API")

# Подключаем middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuditMiddleware)

@app.on_event("startup")
async def startup():
    await db.connect()
    # Создаем индексы для аудита
    await db.client.audit_logs.create_index([("timestamp", -1)])
    await db.client.audit_logs.create_index([("user_id", 1)])
    await db.client.audit_logs.create_index([("resource_type", 1), ("resource_id", 1)])

@app.on_event("shutdown")
async def shutdown():
    await db.close()

# Подключаем роуты
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])