"""
Configuration Management
Loads settings from environment variables
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from .env file"""
    
    # Database
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # JWT Configuration
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # API Configuration
    API_KEY: str = "your-secret-api-key-here"
    API_RATE_LIMIT: int = 10000  # requests per minute
    
    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # File Storage Paths
    UPLOADS_DIR: str = "./uploads"
    MODELS_DIR: str = "./models"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure directories exist
Path(settings.UPLOADS_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.MODELS_DIR).mkdir(parents=True, exist_ok=True)
Path("./logs").mkdir(parents=True, exist_ok=True)
