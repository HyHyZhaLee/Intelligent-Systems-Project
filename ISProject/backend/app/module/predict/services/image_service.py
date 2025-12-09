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
    
    # Log file details
    logger.info(
        f"Processing image - filename: {file.filename}, "
        f"content_type: {file.content_type}, "
        f"file_size: {len(contents)} bytes"
    )
    
    # Validate file is not empty
    if len(contents) == 0:
        logger.error(f"Received empty file: {file.filename}")
        raise ValueError("File is empty. Please upload a valid image file.")
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    if len(contents) > max_size:
        logger.error(f"File size {len(contents)} bytes exceeds maximum of {max_size} bytes")
        raise ValueError(f"File size exceeds maximum allowed size of 5MB")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        logger.error(f"Invalid content type: {file.content_type}")
        raise ValueError("File must be an image (PNG, JPG, JPEG)")
    
    # Log first few bytes to verify file content
    logger.debug(f"File first 20 bytes (hex): {contents[:20].hex()}")
    
    # Preprocess image
    preprocessed = preprocess_image(contents)
    
    logger.info(
        f"Successfully processed image: {file.filename}, "
        f"preprocessed shape: {preprocessed.shape}, "
        f"min: {preprocessed.min():.4f}, max: {preprocessed.max():.4f}"
    )
    
    return preprocessed, file.filename
