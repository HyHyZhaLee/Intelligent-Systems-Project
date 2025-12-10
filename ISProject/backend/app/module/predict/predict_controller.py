"""
Prediction Controller
Handles image prediction endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.module.predict.schemas import (
    PredictionResponse, BatchJobResponse, BatchJobStatusResponse
)
from app.module.predict.services.predict_service import PredictService
from app.core.dependencies import get_optional_auth
from app.core.audit_logger import AuditLogger
from app.core.request_context import get_client_ip, get_user_agent
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
    
    Note: Model training starts automatically on app startup if no pre-trained model exists.
    Check this endpoint to see if the model is ready before making predictions.
    """
    training_status = SVMService.get_training_status()
    
    status_messages = {
        "not_started": "Model training has not started yet",
        "in_progress": "Model is currently training. Please wait... (typically takes 12-15 minutes)",
        "completed": "Model is ready for predictions",
        "failed": "Model training failed. Please check logs or retry."
    }
    
    return {
        "status": training_status,
        "message": status_messages.get(training_status, "Unknown status"),
        "ready": training_status == "completed",
        "info": "Model trains automatically on startup. Use POST /api/predict/train to retrain manually."
    }


@router.post("/predict/train", status_code=status.HTTP_202_ACCEPTED)
async def trigger_training(
    current_user: Optional[dict] = Depends(get_optional_auth),
    db: Session = Depends(get_db)
):
    """
    Manually trigger model training
    
    This endpoint allows you to manually start model training.
    Training happens in the background and typically takes 5-8 minutes.
    
    Use GET /api/predict/status to check training progress.
    
    Note: Training also happens automatically on app startup if no pre-trained model exists.
    
    Authentication: Optional (but recommended for admin users)
    
    Returns:
        dict with training status
    """
    training_status = SVMService.get_training_status()
    
    if training_status == "in_progress":
        logger.info("Training already in progress, rejecting new training request")
        return {
            "success": False,
            "message": "Model training is already in progress. Please wait for it to complete.",
            "status": training_status
        }
    
    if training_status == "completed":
        logger.info("Retraining model (previous model will be replaced)")
    
    # Start background training
    logger.info(f"Manual training triggered by user: {current_user.get('email') if current_user else 'guest'}")
    SVMService.start_background_training()
    
    return {
        "success": True,
        "message": "Model training started in background with data augmentation. Use GET /api/predict/status to check progress.",
        "status": "in_progress",
        "estimated_time": "20-25 minutes"
    }


@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict_digit(
    request: Request,
    file: UploadFile = File(...),
    save_debug: bool = False,
    current_user: Optional[dict] = Depends(get_optional_auth),
    db: Session = Depends(get_db)
):
    """
    Predict digit from uploaded image (0-9)
    
    **This endpoint only performs predictions using the pre-trained model.**
    Model training happens automatically on app startup (see startup logs).
    
    - **file**: Image file (PNG, JPG, JPEG, max 5MB)
    - **save_debug**: If True, save preprocessing debug images to debug_preprocessing/ folder (default: False)
    
    Returns predicted digit (0-9) and confidence score
    
    **Model Training:**
    - Model is trained automatically when the app starts (if not already trained)
    - Training takes 20-25 minutes in the background (90k augmented samples)
    - Use GET /api/predict/status to check if model is ready
    - Use POST /api/predict/train to manually retrain the model
    
    **Authentication:** Optional (guest access allowed)
    
    **Rate limits:**
    - Guest: 100 requests/minute
    - Authenticated: 10,000 requests/minute
    
    **Error Codes:**
    - 503: Model is still training or training failed
    - 400: Invalid image format or size
    - 422: Validation error
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
    
    # Extract request context for audit logging
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    user_id = current_user.get("id") if current_user else None
    
    try:
        result = await predict_service.predict_image(file, current_user, db, save_debug=save_debug)
        
        # Log successful prediction
        AuditLogger.log_api_call(
            db=db,
            action="predict",
            user_id=user_id,
            details={
                "digit": result.get("digit"),
                "confidence": result.get("confidence"),
                "processing_time_ms": result.get("processing_time_ms"),
                "filename": file.filename
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return PredictionResponse(
            success=True,
            data=result,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        # Log failed prediction
        AuditLogger.log_api_call(
            db=db,
            action="predict",
            user_id=user_id,
            details={
                "error": str(e),
                "filename": file.filename if file else None
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        raise


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
