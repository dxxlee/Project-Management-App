from fastapi import FastAPI
from app.routes import users, tasks

app = FastAPI()

# Подключаем API маршруты
app.include_router(users.router)
app.include_router(tasks.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
