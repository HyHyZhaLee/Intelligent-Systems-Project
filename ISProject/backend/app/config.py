"""
Configuration Management
Loads settings from environment variables
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from pathlib import Path
import os


class Settings(BaseSettings):
    """Application settings loaded from .env file"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields from .env that aren't defined
    )
    
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
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"


# Create settings instance
settings = Settings()

# Parse ALLOWED_ORIGINS manually from environment (after Settings is created)
# This avoids Pydantic validation issues with comma-separated strings
_allowed_origins_str = os.getenv('ALLOWED_ORIGINS', "http://localhost:5173,http://localhost:3000")
# Use object.__setattr__ to bypass Pydantic's attribute setting restrictions
object.__setattr__(settings, 'ALLOWED_ORIGINS', [
    origin.strip() for origin in _allowed_origins_str.split(',') if origin.strip()
])

# Ensure directories exist
Path(settings.UPLOADS_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.MODELS_DIR).mkdir(parents=True, exist_ok=True)
Path("./logs").mkdir(parents=True, exist_ok=True)
