from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GEMINI_API_KEY: str
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    DB_URL: str = "postgresql+psycopg://rulecheck_user:your_password@localhost:5432/rulecheck_db"
    STORAGE_DIR: str = "./app/storage"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
