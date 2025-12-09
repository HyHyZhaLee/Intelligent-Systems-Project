"""
Database Configuration
SQLite database setup with SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database - create all tables"""
    # Import all models to ensure they're registered with Base
    from app.shared.models.user import User
    from app.shared.models.audit_log import AuditLog
    from app.shared.models.batch_job import BatchJob
    from app.shared.models.model_metadata import ModelMetadata
    Base.metadata.create_all(bind=engine)
