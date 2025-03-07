from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.middleware.audit import AuditMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.database import db
from app.routes import auth, projects, tasks, teams
from app.database import get_database
from app.init_schema import init_schema_validation
from app.indexing import create_indexes
from app.sharding import configure_sharding




app = FastAPI(title="Project Management API")

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuditMiddleware)

@app.on_event("startup")
async def startup():
    await db.connect()
    await init_schema_validation()
    await create_indexes()
    
    db_instance = db.client.get_database()

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


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/api", tags=["tasks"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(auth.router, prefix="/api", tags=["users"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
