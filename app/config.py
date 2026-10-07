import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Geospatial File Measurement API"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/app.db"
    UPLOAD_DIR: Path = UPLOAD_DIR
    MAX_FILE_SIZE_MB: int = 50

    class Config:
        env_file = ".env"

settings = Settings()
