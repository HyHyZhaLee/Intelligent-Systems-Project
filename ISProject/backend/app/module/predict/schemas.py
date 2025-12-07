"""
Prediction Schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PredictionResponse(BaseModel):
    success: bool
    data: dict
    message: Optional[str] = None
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "digit": 5,
                    "confidence": 0.95,
                    "processing_time_ms": 150
                },
                "timestamp": "2025-01-27T10:00:00Z"
            }
        }


class BatchJobRequest(BaseModel):
    """Request for batch processing"""
    pass  # Will accept multipart/form-data with files


class BatchJobResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "job_id": "batch_123456",
                    "status": "queued",
                    "total_images": 100
                },
                "timestamp": "2025-01-27T10:00:00Z"
            }
        }


class BatchJobStatusResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "job_id": "batch_123456",
                    "status": "processing",
                    "total_images": 100,
                    "processed_images": 45,
                    "progress_percentage": 45.0
                },
                "timestamp": "2025-01-27T10:00:00Z"
            }
        }
