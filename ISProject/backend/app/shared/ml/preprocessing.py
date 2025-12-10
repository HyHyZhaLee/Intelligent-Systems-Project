"""
Image Preprocessing
Converts uploaded images to format suitable for ML models
Enhanced preprocessing for real-world images
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
import io
from typing import Union
import logging

logger = logging.getLogger(__name__)


def preprocess_image(image_file: Union[bytes, io.BytesIO, Image.Image], save_debug: bool = False, debug_filename: str = None) -> np.ndarray:
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
        save_debug: If True, save intermediate preprocessing steps for debugging
        debug_filename: Optional filename for debug output
    
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
        
        # Step 0.5: Denoise for low-quality images
        # Apply median filter to remove noise while preserving edges
        img = img.filter(ImageFilter.MedianFilter(size=3))
        logger.debug("Applied median filter for denoising")
        
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
            logger.debug("Converted image to grayscale")
        
        # OPTIMIZED PREPROCESSING - balance between simplicity and quality
        # Key insight: MNIST digits are well-centered and have good stroke thickness
        # User images may have thin strokes or be off-center
        
        # Save original for debugging
        if save_debug and debug_filename:
            import os
            debug_dir = "./debug_preprocessing"
            os.makedirs(debug_dir, exist_ok=True)
            img.save(f"{debug_dir}/{debug_filename}_01_original.png")
            logger.info(f"Saved original image to {debug_dir}/{debug_filename}_01_original.png")
        
        # Convert to numpy array
        img_array = np.array(img, dtype=np.float32)
        
        # Step 1: Invert if needed (BLACK digit on WHITE bg → WHITE digit on BLACK bg)
        mean_value = img_array.mean()
        should_invert = mean_value > 127.5
        
        if should_invert:
            logger.info(f"Inverting image (mean={mean_value:.1f}) - BLACK on WHITE → WHITE on BLACK")
            img_array = 255.0 - img_array
        else:
            logger.debug(f"No inversion needed (mean={mean_value:.1f})")
        
        # Save inverted image
        if save_debug and debug_filename:
            img_inv = Image.fromarray(img_array.astype(np.uint8), mode='L')
            img_inv.save(f"{debug_dir}/{debug_filename}_02_inverted.png")
            logger.info(f"Saved inverted image to {debug_dir}/{debug_filename}_02_inverted.png")
        
        # Step 1.2: Enhance contrast for low-quality images
        # Use adaptive thresholding for better digit extraction
        # More aggressive approach for very blurry images
        if img_array.std() < 60:  # Low contrast image (increased threshold)
            # Apply Otsu's thresholding for better binary separation
            from PIL import ImageOps
            img_pil_temp = Image.fromarray(img_array.astype(np.uint8), mode='L')
            
            # Increase contrast significantly
            img_pil_temp = ImageOps.autocontrast(img_pil_temp, cutoff=2)
            img_array = np.array(img_pil_temp, dtype=np.float32)
            logger.info(f"Applied autocontrast - std was {img_array.std():.1f}")
            
            # Apply binary thresholding if still very low contrast
            if img_array.std() < 50:
                threshold_val = np.percentile(img_array[img_array > 0], 50)
                img_array = np.where(img_array > threshold_val, img_array, 0)
                # Normalize remaining pixels to full range
                if img_array.max() > 0:
                    img_array = (img_array / img_array.max()) * 255.0
                    logger.info(f"Applied binary thresholding at {threshold_val:.1f}")
        
        # Step 1.3: Sharpen edges to recover from blur
        # Apply unsharp mask to enhance edges
        img_pil_temp = Image.fromarray(img_array.astype(np.uint8), mode='L')
        img_pil_temp = img_pil_temp.filter(ImageFilter.SHARPEN)
        img_array = np.array(img_pil_temp, dtype=np.float32)
        logger.debug("Applied sharpening filter")
        
        if save_debug and debug_filename:
            img_sharp = Image.fromarray(img_array.astype(np.uint8), mode='L')
            img_sharp.save(f"{debug_dir}/{debug_filename}_02b_sharpened.png")
            logger.info(f"Saved sharpened image to {debug_dir}/{debug_filename}_02b_sharpened.png")
        
        # Step 1.5: DISABLED dilation - causes number 9 to look like number 8
        # Dilation thickens strokes which helps thin digits but merges separate 
        # components (like the circle and tail of 9) making them look like 8
        # For now, relying on 2-stage resize (56x56 → 28x28) to preserve structure
        logger.debug("Skipping dilation to preserve digit structure (especially 9 vs 8)")
        
        # Step 2: Resize with better quality
        # First resize to intermediate size to preserve more details
        # Then resize to 28x28 - this 2-step approach preserves thin strokes better
        img_pil = Image.fromarray(img_array.astype(np.uint8), mode='L')
        
        # Get dimensions
        w, h = img_pil.size
        max_dim = max(w, h)
        
        # First pass: resize to 56x56 (2x final size) if image is large
        if max_dim > 56:
            # Maintain aspect ratio during first resize
            scale = 56 / max_dim
            new_w = int(w * scale)
            new_h = int(h * scale)
            img_pil = img_pil.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Create 56x56 canvas and center the resized image
            canvas = Image.new('L', (56, 56), color=0)
            paste_x = (56 - new_w) // 2
            paste_y = (56 - new_h) // 2
            canvas.paste(img_pil, (paste_x, paste_y))
            img_pil = canvas
            
            if save_debug and debug_filename:
                img_pil.save(f"{debug_dir}/{debug_filename}_03_resized_56x56.png")
        
        # Final resize: 56x56 → 28x28 (or direct to 28x28 if already small)
        img_pil = img_pil.resize((28, 28), Image.Resampling.LANCZOS)
        img_array = np.array(img_pil, dtype=np.float32)
        
        # Save resized image
        if save_debug and debug_filename:
            # Enlarge for visibility
            img_resized_large = img_pil.resize((280, 280), Image.Resampling.NEAREST)
            img_resized_large.save(f"{debug_dir}/{debug_filename}_03_resized_28x28.png")
            logger.info(f"Saved resized image to {debug_dir}/{debug_filename}_03_resized_28x28.png")
        
        # Save resized image
        if save_debug and debug_filename:
            # Enlarge for visibility
            img_resized_large = img_pil.resize((280, 280), Image.Resampling.NEAREST)
            img_resized_large.save(f"{debug_dir}/{debug_filename}_03_resized_28x28.png")
            logger.info(f"Saved resized image to {debug_dir}/{debug_filename}_03_resized_28x28.png")
        
        # Validate array was created successfully
        if img_array.size == 0:
            raise ValueError("Image array is empty after conversion")
        
        # Step 3: Normalize to [0, 1] range
        img_array = img_array / 255.0
        
        # Save normalized image
        if save_debug and debug_filename:
            # Convert back to 0-255 for visualization
            img_norm_vis = Image.fromarray((img_array * 255).astype(np.uint8), mode='L')
            img_norm_vis_large = img_norm_vis.resize((280, 280), Image.Resampling.NEAREST)
            img_norm_vis_large.save(f"{debug_dir}/{debug_filename}_04_normalized.png")
            logger.info(f"Saved normalized image to {debug_dir}/{debug_filename}_04_normalized.png")
        
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
