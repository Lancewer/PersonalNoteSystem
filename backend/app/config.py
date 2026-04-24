import os
from pathlib import Path
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/notes_db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    UPLOAD_DIR: str = ""
    CORS_ORIGINS: str = ""  # Comma-separated list, empty = allow all for dev

    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 始终转换为绝对路径
        if not self.UPLOAD_DIR or not os.path.isabs(self.UPLOAD_DIR):
            self.UPLOAD_DIR = str(BACKEND_DIR / (self.UPLOAD_DIR or "uploads"))


settings = Settings()
