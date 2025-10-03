from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    DB_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/postgres"
    STORAGE_DIR: str = "./app/storage"
    ANALYZE_MODE: str = "mock"  # auto | mock | llm

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
