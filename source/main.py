from fastapi import FastAPI
from .routers import tasks

app = FastAPI()
app.include_router(tasks.router)

@app.get("/health")
def health():
    return {"status": "ok"}
