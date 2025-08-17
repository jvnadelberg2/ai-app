# source/server.py
from fastapi import FastAPI
from .routers import tasks  # <-- relative import

def get_app() -> FastAPI:
    app = FastAPI()

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.include_router(tasks.router)
    return app

# so main can import `app` directly
app = get_app()
