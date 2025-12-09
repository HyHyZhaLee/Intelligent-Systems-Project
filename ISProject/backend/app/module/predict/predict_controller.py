"""
Prediction Controller
Handles image prediction endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.module.predict.schemas import (
    PredictionResponse, BatchJobResponse, BatchJobStatusResponse
)
from app.module.predict.services.predict_service import PredictService
from app.core.dependencies import get_optional_auth
from app.shared.ml.svm_service import SVMService
from datetime import datetime
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
predict_service = PredictService()


@router.get("/predict/status", status_code=status.HTTP_200_OK)
async def get_training_status():
    """
    Get SVM model training status
    
    Returns:
        dict with training status and message
    """
    training_status = SVMService.get_training_status()
    
    status_messages = {
        "not_started": "Model training has not started yet",
        "in_progress": "Model is currently training. Please wait...",
        "completed": "Model is ready for predictions",
        "failed": "Model training failed. Please check logs or retry."
    }
    
    return {
        "status": training_status,
        "message": status_messages.get(training_status, "Unknown status"),
        "ready": training_status == "completed"
    }


@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict_digit(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_optional_auth),
    db: Session = Depends(get_db)
):
    """
    Single image prediction endpoint
    
    - **file**: Image file (PNG, JPG, JPEG, max 5MB)
    
    Returns predicted digit (0-9) and confidence score
    
    Authentication: Optional (guest access allowed)
    Rate limit: 100 requests/minute (guest), 10,000/minute (authenticated)
    
    Returns 503 Service Unavailable if model is still training
    """
    # Check training status first
    training_status = SVMService.get_training_status()
    
    if training_status == "in_progress":
        logger.info("Prediction request received but model is still training (503)")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is currently training. Please wait for training to complete and try again."
        )
    
    if training_status == "failed":
        logger.warning("Prediction request received but model training failed (503)")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model training failed. Please check server logs or contact administrator."
        )
    
    if training_status == "not_started":
        logger.warning("Prediction request received but model training has not started (503)")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model training has not started. Please wait for training to begin."
        )
    
    # Log file receipt details
    # Note: FastAPI UploadFile doesn't have size attribute until read
    # We'll log size after reading in image_service
    logger.info(
        f"Received prediction request - filename: {file.filename}, "
        f"content_type: {file.content_type}"
    )
    
    result = await predict_service.predict_image(file, current_user, db)
    return PredictionResponse(
        success=True,
        data=result,
        timestamp=datetime.utcnow().isoformat()
    )


@router.post("/batch", response_model=BatchJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_batch_job(
    files: List[UploadFile] = File(...),
    current_user: Optional[dict] = Depends(get_optional_auth),
    db: Session = Depends(get_db)
):
    """
    Batch image processing endpoint
    
    - **files**: Multiple image files or ZIP file containing images
    
    Returns job ID for tracking batch processing status
    
    Authentication: Required (JWT token or API key)
    Rate limit: 10 jobs/minute
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for batch processing"
        )
    
    # TODO: Implement batch job creation
    # job_id = await predict_service.create_batch_job(files, current_user, db)
    # return BatchJobResponse(
    #     success=True,
    #     data={
    #         "job_id": job_id,
    #         "status": "queued",
    #         "total_images": len(files)
    #     },
    #     timestamp=datetime.utcnow().isoformat()
    # )
    
    return BatchJobResponse(
        success=True,
        data={
            "job_id": "batch_placeholder_123",
            "status": "queued",
            "total_images": len(files)
        },
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/batch/{job_id}", response_model=BatchJobStatusResponse, status_code=status.HTTP_200_OK)
async def get_batch_job_status(
    job_id: str,
    current_user: Optional[dict] = Depends(get_optional_auth),
    db: Session = Depends(get_db)
):
    """
    Get batch job status
    
    - **job_id**: Batch job identifier
    
    Returns current status and progress of batch job
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # TODO: Implement batch job status retrieval
    # status_data = await predict_service.get_batch_job_status(job_id, current_user, db)
    # return BatchJobStatusResponse(
    #     success=True,
    #     data=status_data,
    #     timestamp=datetime.utcnow().isoformat()
    # )
    
    return BatchJobStatusResponse(
        success=True,
        data={
            "job_id": job_id,
            "status": "processing",
            "total_images": 100,
            "processed_images": 45,
            "progress_percentage": 45.0
        },
        timestamp=datetime.utcnow().isoformat()
    )
