"""
Image Service
Handles image file operations and preprocessing
"""
from fastapi import UploadFile
from app.shared.ml.preprocessing import preprocess_image
import logging

logger = logging.getLogger(__name__)


async def process_uploaded_image(file: UploadFile) -> tuple:
    """
    Process uploaded image file
    
    Args:
        file: Uploaded file from FastAPI
    
    Returns:
        tuple: (preprocessed_image_array, original_filename)
    """
    # Read file content
    contents = await file.read()
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    if len(contents) > max_size:
        raise ValueError(f"File size exceeds maximum allowed size of 5MB")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise ValueError("File must be an image (PNG, JPG, JPEG)")
    
    # Preprocess image
    preprocessed = preprocess_image(contents)
    
    logger.info(f"Processed image: {file.filename}, size: {len(contents)} bytes")
    
    return preprocessed, file.filename
