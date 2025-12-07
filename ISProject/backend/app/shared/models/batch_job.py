"""
Batch Job Model
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class BatchJob(Base):
    __tablename__ = "batch_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), nullable=False)  # 'queued', 'processing', 'completed', 'failed'
    total_images = Column(Integer, nullable=False)
    processed_images = Column(Integer, default=0)
    results_path = Column(String(500))
    error_message = Column(String(1000))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship
    user = relationship("User", backref="batch_jobs")
