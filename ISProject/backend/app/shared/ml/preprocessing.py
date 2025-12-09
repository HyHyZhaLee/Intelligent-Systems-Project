"""
Image Preprocessing
Converts uploaded images to format suitable for ML models
"""
import numpy as np
from PIL import Image
import io
from typing import Union
import logging

logger = logging.getLogger(__name__)


def preprocess_image(image_file: Union[bytes, io.BytesIO, Image.Image]) -> np.ndarray:
    """
    Preprocess image for ML model input
    
    Steps:
    1. Open image
    2. Convert to grayscale
    3. Resize to 28x28 (MNIST standard)
    4. Normalize pixel values to [0, 1]
    5. Reshape to (1, 784) for model input
    
    Args:
        image_file: Image file (bytes, BytesIO, or PIL Image)
    
    Returns:
        numpy array of shape (1, 784) with normalized pixel values
    """
    try:
        # Open image
        if isinstance(image_file, Image.Image):
            img = image_file
        elif isinstance(image_file, bytes):
            img = Image.open(io.BytesIO(image_file))
        else:
            img = Image.open(image_file)
        
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Resize to 28x28 (MNIST standard)
        img = img.resize((28, 28), Image.Resampling.LANCZOS)
        
        # Convert to numpy array
        img_array = np.array(img, dtype=np.float32)
        
        # Normalize to [0, 1] range
        img_array = img_array / 255.0
        
        # Reshape to (1, 784) for model input
        img_array = img_array.reshape(1, 784)
        
        logger.debug(f"Preprocessed image: shape={img_array.shape}, min={img_array.min()}, max={img_array.max()}")
        
        return img_array
    
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise ValueError(f"Failed to preprocess image: {str(e)}")
