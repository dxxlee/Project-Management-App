from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.middleware.audit import AuditMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.database import db
from app.routes import auth, projects, tasks, teams
from app.database import get_database



app = FastAPI(title="Project Management API")

# Настройка CORS
origins = [
    "http://localhost:3000",  # React-приложение
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuditMiddleware)

@app.on_event("startup")
async def startup():
    await db.connect()
    
    # Получаем базу данных
    db_instance = db.client.get_database()

    # Создаем индексы для аудита
    await db_instance.audit_logs.create_index([("timestamp", -1)])
    await db_instance.audit_logs.create_index([("user_id", 1)])
    await db_instance.audit_logs.create_index([("resource_type", 1), ("resource_id", 1)])

@app.get("/test_db")
async def test_db():
    db_instance = get_database()
    collection_names = await db_instance.list_collection_names()
    return {"message": "Connected to MongoDB!", "collections": collection_names}

@app.on_event("shutdown")
async def shutdown():
    await db.close()


# Подключаем роуты
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
