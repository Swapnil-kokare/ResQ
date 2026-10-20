"""Main FastAPI application entrypoint for ResQ Study Planner."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="ResQ — AI Study Planner for Deadlines",
    description=(
        "AI-powered constraint satisfaction study scheduler for engineering students. "
        "Solves conflict-free timetables using backtracking search with MRV and Forward Checking."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Parse allowed origins from environment variable if provided
raw_origins = os.getenv("ALLOWED_ORIGINS", "")
if raw_origins:
    allowed_origins = [orig.strip() for orig in raw_origins.split(",") if orig.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

# Enable CORS for local and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "app": "ResQ — AI Study Planner for Deadlines",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health",
        "scenarios": "/api/demo/scenarios"
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
