"""
Model Metadata Model
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float
from sqlalchemy.sql import func
from app.database import Base


class ModelMetadata(Base):
    __tablename__ = "model_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String(50), nullable=False)  # 'svm', 'random_forest', 'neural_network'
    model_path = Column(String(500), nullable=False)
    hyperparameters = Column(Text)  # JSON string
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    confusion_matrix = Column(Text)  # JSON string
    roc_curve_data = Column(Text)  # JSON string
    trained_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
