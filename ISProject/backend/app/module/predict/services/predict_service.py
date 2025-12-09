"""
Prediction Service
Business logic for image prediction
"""
from fastapi import UploadFile
from sqlalchemy.orm import Session
from typing import Optional, List
import time
import logging
from app.module.predict.services.image_service import process_uploaded_image
from app.module.predict.services.ml_inference_service import predict_digit

logger = logging.getLogger(__name__)


class PredictService:
    """Service for prediction operations"""
    
    async def predict_image(
        self,
        image_file: UploadFile,
        current_user: Optional[dict],
        db: Session,
        model_type: str = "svm"
    ) -> dict:
        """
        Predict digit from uploaded image
        
        Args:
            image_file: Uploaded image file
            current_user: Current user (optional for guest access)
            db: Database session
            model_type: Type of model to use
        
        Returns:
            dict: Prediction result with digit, confidence, and processing time
        """
        start_time = time.time()
        
        try:
            # Process uploaded image
            preprocessed_image, filename = await process_uploaded_image(image_file)
            
            # Run prediction
            predicted_digit, confidence = predict_digit(preprocessed_image, model_type)
            
            # Calculate processing time
            processing_time = int((time.time() - start_time) * 1000)
            
            # TODO: Log prediction to audit log
            # if current_user:
            #     from app.shared.models.audit_log import AuditLog
            #     audit_log = AuditLog(
            #         user_id=current_user.get("id"),
            #         event_type="api",
            #         action="predict_digit",
            #         details=f"digit={predicted_digit}, confidence={confidence:.4f}, file={filename}"
            #     )
            #     db.add(audit_log)
            #     db.commit()
            
            logger.info(
                f"Prediction completed: digit={predicted_digit}, "
                f"confidence={confidence:.4f}, time={processing_time}ms"
            )
            
            return {
                "digit": predicted_digit,
                "confidence": round(confidence * 100, 2),  # Convert to percentage
                "processing_time_ms": processing_time
            }
        
        except Exception as e:
            logger.error(f"Error in predict_image: {str(e)}")
            raise
    
    async def create_batch_job(
        self,
        files: List[UploadFile],
        current_user: dict,
        db: Session
    ) -> str:
        """
        Create batch processing job
        
        TODO: Implement
        - Validate files
        - Create batch job record in database
        - Queue job for processing (background task)
        - Return job ID
        """
        # Placeholder
        return "batch_job_123"
    
    async def get_batch_job_status(
        self,
        job_id: str,
        current_user: dict,
        db: Session
    ) -> dict:
        """
        Get batch job status and progress
        
        TODO: Implement
        - Load batch job from database
        - Check current status
        - Calculate progress
        - Return status data
        """
        # Placeholder
        return {
            "job_id": job_id,
            "status": "processing",
            "total_images": 100,
            "processed_images": 45,
            "progress_percentage": 45.0
        }
