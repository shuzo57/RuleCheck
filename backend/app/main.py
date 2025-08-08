from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.db import init_db

app = FastAPI(title="Slide Compliance Checker (local)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
app.include_router(router, prefix="/api")

@app.on_event("startup")
def _startup():
    init_db()
