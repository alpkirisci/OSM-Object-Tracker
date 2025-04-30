import os
from typing import Dict, List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "OpenStreetMap Object Tracking API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "API for tracking objects on OpenStreetMap"
    
    # Debug settings
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    # CORS settings
    ALLOWED_HOSTS: List[str] = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/osm_tracking_db")
    
    # Media settings
    MEDIA_DIR: str = "media"
    
    class Config:
        env_file = ".env"

# Create settings instance
settings = Settings()