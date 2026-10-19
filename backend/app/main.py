"""Main FastAPI application entrypoint for ResQ Study Planner."""
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

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "app": "ResQ — AI Study Planner for Deadlines",
        "docs": "/docs",
        "health": "/api/health",
        "scenarios": "/api/demo/scenarios"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
