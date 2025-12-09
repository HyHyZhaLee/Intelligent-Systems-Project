"""
Image Preprocessing
Converts uploaded images to format suitable for ML models
Enhanced preprocessing for real-world images
"""
import numpy as np
from PIL import Image, ImageFilter
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
            if len(image_file) == 0:
                raise ValueError("Image file is empty")
            img = Image.open(io.BytesIO(image_file))
        else:
            img = Image.open(image_file)
        
        # Validate image was opened successfully
        if img is None:
            raise ValueError("Failed to open image file")
        
        # Log original image properties
        logger.debug(f"Original image - size: {img.size}, mode: {img.mode}, format: {img.format}")
        
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
            logger.debug("Converted image to grayscale")
        
        # Get original size for logging
        original_size = img.size
        logger.debug(f"Original image size: {original_size}")
        
        # Step 1: Resize to intermediate size (56x56) to preserve detail while making processing faster
        # This is 2x the final size, which helps with centering and detail preservation
        intermediate_size = 56
        img = img.resize((intermediate_size, intermediate_size), Image.Resampling.LANCZOS)
        logger.debug(f"Resized to intermediate size: {intermediate_size}x{intermediate_size}")
        
        # Convert to numpy array for processing
        img_array = np.array(img, dtype=np.float32)
        
        # Step 2: Enhance contrast to make digit more visible
        # Use percentile-based contrast stretching
        p2, p98 = np.percentile(img_array, (2, 98))
        if p98 > p2:
            img_array = np.clip((img_array - p2) / (p98 - p2) * 255.0, 0, 255)
            logger.debug(f"Contrast enhanced - percentiles: p2={p2:.1f}, p98={p98:.1f}")
        
        # Step 3: Determine if we need to invert (MNIST expects dark digits on light background)
        # Handle both cases:
        # - Black digit on white background (no inversion needed)
        # - White digit on black background (needs inversion)
        mean_before_invert = img_array.mean()
        median_value = np.median(img_array)
        dark_pixels = np.sum(img_array < 128)
        light_pixels = np.sum(img_array >= 128)
        dark_ratio = 0.0
        light_ratio = 0.0
        total_pixels = dark_pixels + light_pixels
        if total_pixels > 0:
            dark_ratio = dark_pixels / total_pixels
            light_ratio = light_pixels / total_pixels
        
        # Heuristic:
        # - If image is overall bright but has enough dark pixels, keep as-is
        # - If image is overall dark (more dark than light) OR median is low, invert
        should_invert = False
        if light_pixels == 0 or dark_pixels == 0:
            # Degenerate case, rely on mean
            should_invert = mean_before_invert > 127.5
        else:
            # If dark dominates heavily, invert to make background light
            if dark_ratio > 0.6:
                should_invert = True
            # If image is bright overall but median is high (white digit on black), invert
            elif mean_before_invert > 150 and median_value > 140:
                should_invert = True
        
        if should_invert:
            logger.info(
                f"Inverting image (mean={mean_before_invert:.1f}, dark_ratio={dark_ratio:.2f}) "
                f"to match MNIST dark-on-light format"
            )
            img_array = 255.0 - img_array
        
        # Step 4: Center the digit in the image
        # Find bounding box of non-background pixels (darker pixels)
        threshold_for_centering = np.percentile(img_array, 30)  # Use 30th percentile as threshold
        non_bg_pixels = img_array < threshold_for_centering
        
        if np.any(non_bg_pixels):
            # Find bounding box
            rows = np.any(non_bg_pixels, axis=1)
            cols = np.any(non_bg_pixels, axis=0)
            
            if np.any(rows) and np.any(cols):
                row_indices = np.where(rows)[0]
                col_indices = np.where(cols)[0]
                
                if len(row_indices) > 0 and len(col_indices) > 0:
                    rmin, rmax = row_indices[0], row_indices[-1]
                    cmin, cmax = col_indices[0], col_indices[-1]
                    
                    # Extract digit region with some padding
                    padding = max(3, int(min(img_array.shape) * 0.05))
                    rmin = max(0, rmin - padding)
                    rmax = min(img_array.shape[0], rmax + padding)
                    cmin = max(0, cmin - padding)
                    cmax = min(img_array.shape[1], cmax + padding)
                    
                    # Extract digit region
                    digit_region = img_array[rmin:rmax, cmin:cmax]
                    
                    # Create new centered image filled with background color
                    h, w = img_array.shape
                    bg_color = np.percentile(img_array, 90)  # Use 90th percentile as background
                    new_img = np.ones((h, w), dtype=np.float32) * bg_color
                    
                    # Calculate position to center the digit
                    new_h, new_w = digit_region.shape
                    start_r = (h - new_h) // 2
                    start_c = (w - new_w) // 2
                    
                    # Place digit in center
                    end_r = min(start_r + new_h, h)
                    end_c = min(start_c + new_w, w)
                    src_h = end_r - start_r
                    src_w = end_c - start_c
                    new_img[start_r:end_r, start_c:end_c] = digit_region[:src_h, :src_w]
                    
                    img_array = new_img
                    logger.debug(f"Centered digit - bounding box: ({rmin},{cmin}) to ({rmax},{cmax})")
        
        # Step 5: Apply gentle contrast enhancement (less aggressive)
        # Use mean and std for adaptive enhancement
        threshold = np.mean(img_array)
        std_dev = np.std(img_array)
        
        # Gentle contrast enhancement: only if there's good variation
        if std_dev > 15:  # Only if there's sufficient variation
            # Less aggressive enhancement to preserve digit features
            binary_mask = img_array < (threshold - std_dev * 0.2)
            img_array = np.where(binary_mask, 
                                np.clip(img_array * 0.75, 0, 255),  # Slightly darken digit areas
                                np.clip(img_array * 1.05, 0, 255))  # Slightly lighten background
            logger.debug(f"Applied gentle contrast enhancement - threshold: {threshold:.1f}, std: {std_dev:.1f}")
        
        # Step 6: Apply slight smoothing to reduce noise
        img_pil = Image.fromarray(img_array.astype(np.uint8), mode='L')
        img_pil = img_pil.filter(ImageFilter.SMOOTH_MORE)
        img_array = np.array(img_pil, dtype=np.float32)
        
        # Step 7: Resize to final 28x28 (MNIST standard)
        img_pil = Image.fromarray(img_array.astype(np.uint8), mode='L')
        img_pil = img_pil.resize((28, 28), Image.Resampling.LANCZOS)
        img_array = np.array(img_pil, dtype=np.float32)
        
        # Validate array was created successfully
        if img_array.size == 0:
            raise ValueError("Image array is empty after conversion")
        
        # Step 8: Normalize to [0, 1] range
        if img_array.max() > 0:
            img_array = img_array / 255.0
        else:
            logger.warning("Image array has max value of 0 after processing")
        
        # Step 9: Final normalization (less aggressive matching)
        # MNIST training data typically has mean around 0.13-0.15
        # Don't force too much - preserve the natural distribution
        current_mean = img_array.mean()
        if current_mean > 0.4:  # Only adjust if significantly too bright
            # Gentle scaling to match training distribution
            target_mean = 0.15  # Target mean for MNIST-like distribution
            scale_factor = target_mean / current_mean if current_mean > 0 else 1.0
            img_array = img_array * scale_factor
            img_array = np.clip(img_array, 0, 1)
            logger.debug(f"Adjusted mean from {current_mean:.3f} to {img_array.mean():.3f}")
        elif current_mean < 0.05:  # If too dark, brighten slightly
            scale_factor = 0.1 / current_mean if current_mean > 0 else 1.0
            img_array = img_array * scale_factor
            img_array = np.clip(img_array, 0, 1)
            logger.debug(f"Brightened image - mean from {current_mean:.3f} to {img_array.mean():.3f}")
        
        # Reshape to (1, 784) for model input
        img_array = img_array.reshape(1, 784)
        
        # Log detailed preprocessing information
        logger.info(
            f"Preprocessed image - shape: {img_array.shape}, "
            f"min: {img_array.min():.4f}, max: {img_array.max():.4f}, "
            f"mean: {img_array.mean():.4f}, std: {img_array.std():.4f}, "
            f"non-zero pixels: {np.count_nonzero(img_array)}/{img_array.size}"
        )
        
        # Validate preprocessed image is not all zeros or all ones
        if img_array.max() == img_array.min():
            logger.warning(f"Preprocessed image has constant value: {img_array.max()}")
            raise ValueError("Preprocessed image has constant pixel values. Please upload an image with visible content.")
        if np.count_nonzero(img_array) == 0:
            logger.error("Preprocessed image is all zeros - image may be blank or corrupted")
            raise ValueError("Preprocessed image is blank. Please upload a valid image with visible content.")
        
        # Log sample values for debugging
        logger.debug(f"Sample pixel values (first 10): {img_array[0, :10]}")
        
        return img_array
    
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise ValueError(f"Failed to preprocess image: {str(e)}")
